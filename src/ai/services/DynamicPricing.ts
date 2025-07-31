import { Fyo } from 'fyo';
import { AIConfig } from '../index';
import { ModelNameEnum } from 'models/types';
import * as ss from 'simple-statistics';

export interface PriceOptimization {
  itemCode: string;
  itemName: string;
  currentPrice: number;
  recommendedPrice: number;
  priceChange: number;
  priceChangePercent: number;
  confidence: number;
  reason: string;
  expectedImpact: {
    demandChange: number;
    revenueChange: number;
    profitChange: number;
  };
}

export interface PriceElasticity {
  itemCode: string;
  elasticity: number;
  demandSensitivity: 'low' | 'medium' | 'high';
  optimalPriceRange: {
    min: number;
    max: number;
  };
}

export class DynamicPricing {
  private fyo: Fyo;
  private config: AIConfig;
  private priceElasticityMap: Map<string, number> = new Map();
  private isInitialized = false;

  constructor(fyo: Fyo, config: AIConfig) {
    this.fyo = fyo;
    this.config = config;
  }

  async initialize(): Promise<void> {
    console.log('Initializing Dynamic Pricing...');
    
    try {
      await this.calculatePriceElasticities();
      this.isInitialized = true;
      console.log('Dynamic Pricing initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Dynamic Pricing:', error);
      throw error;
    }
  }

  private async calculatePriceElasticities(): Promise<void> {
    try {
      const items = await this.fyo.db.getAllRaw(ModelNameEnum.Item);
      
      for (const item of items) {
        const elasticity = await this.calculateItemElasticity(item.name);
        this.priceElasticityMap.set(item.name, elasticity);
      }
      
      console.log(`Calculated elasticity for ${this.priceElasticityMap.size} items`);
    } catch (error) {
      console.error('Error calculating price elasticities:', error);
    }
  }

  private async calculateItemElasticity(itemCode: string): Promise<number> {
    try {
      // Get historical sales data with price changes
      const salesData = await this.fyo.db.getAllRaw(ModelNameEnum.SalesInvoiceItem, {
        filters: { item: itemCode },
        orderBy: 'date',
        limit: 1000
      });

      if (salesData.length < 10) return -0.5; // Default elasticity

      // Group by price points and calculate demand
      const pricePoints = this.groupByPricePoints(salesData);
      
      if (pricePoints.length < 3) return -0.5; // Need multiple price points

      // Calculate elasticity using log-log regression
      const elasticity = this.calculateElasticityCoefficient(pricePoints);
      
      // Bound elasticity between -3 and 0 (realistic range)
      return Math.max(-3, Math.min(0, elasticity));
    } catch (error) {
      console.error(`Error calculating elasticity for ${itemCode}:`, error);
      return -0.5; // Default elasticity
    }
  }

  private groupByPricePoints(salesData: any[]): Array<{ price: number; quantity: number; count: number }> {
    const priceGroups: Record<string, { totalQuantity: number; count: number }> = {};
    
    for (const sale of salesData) {
      const price = Math.round(Number(sale.rate) || 0);
      const quantity = Number(sale.quantity) || 0;
      
      const priceKey = price.toString();
      
      if (!priceGroups[priceKey]) {
        priceGroups[priceKey] = { totalQuantity: 0, count: 0 };
      }
      
      priceGroups[priceKey].totalQuantity += quantity;
      priceGroups[priceKey].count += 1;
    }
    
    return Object.entries(priceGroups).map(([priceStr, data]) => ({
      price: Number(priceStr),
      quantity: data.totalQuantity / data.count, // Average quantity per transaction
      count: data.count
    })).filter(point => point.price > 0 && point.quantity > 0);
  }

  private calculateElasticityCoefficient(pricePoints: Array<{ price: number; quantity: number; count: number }>): number {
    if (pricePoints.length < 2) return -0.5;
    
    // Filter out outliers
    const filtered = pricePoints.filter(point => point.count >= 2);
    if (filtered.length < 2) return -0.5;
    
    // Sort by price
    filtered.sort((a, b) => a.price - b.price);
    
    // Calculate percentage changes
    const changes = [];
    for (let i = 1; i < filtered.length; i++) {
      const pricePrev = filtered[i - 1].price;
      const priceCurr = filtered[i].price;
      const quantityPrev = filtered[i - 1].quantity;
      const quantityCurr = filtered[i].quantity;
      
      if (pricePrev > 0 && quantityPrev > 0) {
        const priceChange = (priceCurr - pricePrev) / pricePrev;
        const quantityChange = (quantityCurr - quantityPrev) / quantityPrev;
        
        if (Math.abs(priceChange) > 0.01) { // Minimum 1% price change
          changes.push({
            priceChange,
            quantityChange
          });
        }
      }
    }
    
    if (changes.length === 0) return -0.5;
    
    // Calculate elasticity as average of quantity change / price change
    const elasticities = changes.map(change => change.quantityChange / change.priceChange);
    return ss.mean(elasticities);
  }

  async calculateOptimalPrice(itemCode: string, currentDemand: number): Promise<number> {
    if (!this.isInitialized) {
      console.warn('Dynamic pricing not initialized');
      return 0;
    }

    try {
      const item = await this.fyo.db.get(ModelNameEnum.Item, itemCode);
      if (!item) return 0;

      const currentPrice = await this.getCurrentPrice(itemCode);
      if (currentPrice === 0) return 0;

      const elasticity = this.priceElasticityMap.get(itemCode) || -0.5;
      const marketConditions = await this.analyzeMarketConditions(itemCode);
      const demandFactor = await this.calculateDemandFactor(itemCode, currentDemand);
      
      // Calculate optimal price using elasticity and market conditions
      const baseOptimalPrice = this.calculateElasticityBasedPrice(currentPrice, elasticity, demandFactor);
      const marketAdjustedPrice = this.applyMarketAdjustments(baseOptimalPrice, marketConditions);
      
      // Apply business constraints
      const constrainedPrice = this.applyPriceConstraints(marketAdjustedPrice, currentPrice, item);
      
      return Math.round(constrainedPrice * 100) / 100; // Round to cents
    } catch (error) {
      console.error(`Error calculating optimal price for ${itemCode}:`, error);
      return 0;
    }
  }

  private async getCurrentPrice(itemCode: string): Promise<number> {
    try {
      // Get most recent price from sales
      const recentSale = await this.fyo.db.getAllRaw(ModelNameEnum.SalesInvoiceItem, {
        filters: { item: itemCode },
        orderBy: 'date DESC',
        limit: 1
      });

      if (recentSale.length > 0) {
        return Number(recentSale[0].rate) || 0;
      }

      // Fallback to item rate
      const item = await this.fyo.db.get(ModelNameEnum.Item, itemCode);
      return Number(item?.rate) || 0;
    } catch (error) {
      return 0;
    }
  }

  private async analyzeMarketConditions(itemCode: string): Promise<{
    competitivePosition: number;
    seasonalFactor: number;
    trendFactor: number;
  }> {
    // Simplified market analysis - in real implementation would include external data
    const recentSales = await this.getRecentSalesData(itemCode, 30);
    
    const seasonalFactor = this.calculateSeasonalFactor(recentSales);
    const trendFactor = this.calculateTrendFactor(recentSales);
    const competitivePosition = 1.0; // Neutral - would need competitor data
    
    return {
      competitivePosition,
      seasonalFactor,
      trendFactor
    };
  }

  private async getRecentSalesData(itemCode: string, days: number): Promise<any[]> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      return await this.fyo.db.getAllRaw(ModelNameEnum.SalesInvoiceItem, {
        filters: {
          item: itemCode,
          date: ['>=', cutoffDate]
        },
        orderBy: 'date'
      });
    } catch (error) {
      return [];
    }
  }

  private calculateSeasonalFactor(salesData: any[]): number {
    if (salesData.length === 0) return 1.0;
    
    const currentMonth = new Date().getMonth();
    const monthlyData: Record<number, number[]> = {};
    
    for (const sale of salesData) {
      const month = new Date(sale.date).getMonth();
      const quantity = Number(sale.quantity) || 0;
      
      if (!monthlyData[month]) monthlyData[month] = [];
      monthlyData[month].push(quantity);
    }
    
    if (Object.keys(monthlyData).length < 3) return 1.0;
    
    const monthlyAvg = Object.entries(monthlyData).map(([month, quantities]) => ({
      month: Number(month),
      avg: ss.mean(quantities)
    }));
    
    const overallAvg = ss.mean(monthlyAvg.map(m => m.avg));
    const currentMonthData = monthlyAvg.find(m => m.month === currentMonth);
    
    return currentMonthData ? currentMonthData.avg / overallAvg : 1.0;
  }

  private calculateTrendFactor(salesData: any[]): number {
    if (salesData.length < 7) return 1.0;
    
    // Compare recent week to previous week
    const recent7Days = salesData.slice(-7);
    const previous7Days = salesData.slice(-14, -7);
    
    if (previous7Days.length === 0) return 1.0;
    
    const recentAvg = ss.mean(recent7Days.map(s => Number(s.quantity) || 0));
    const previousAvg = ss.mean(previous7Days.map(s => Number(s.quantity) || 0));
    
    return previousAvg > 0 ? recentAvg / previousAvg : 1.0;
  }

  private async calculateDemandFactor(itemCode: string, currentDemand: number): Promise<number> {
    // Get average demand for comparison
    const recentSales = await this.getRecentSalesData(itemCode, 30);
    
    if (recentSales.length === 0) return 1.0;
    
    const avgDemand = ss.mean(recentSales.map(s => Number(s.quantity) || 0));
    
    return avgDemand > 0 ? currentDemand / avgDemand : 1.0;
  }

  private calculateElasticityBasedPrice(currentPrice: number, elasticity: number, demandFactor: number): number {
    // If demand is higher than average, we can increase price
    // If demand is lower, we should decrease price
    // Elasticity tells us how sensitive demand is to price changes
    
    const demandDeviation = demandFactor - 1.0; // How much demand deviates from normal
    const priceAdjustment = -demandDeviation / Math.abs(elasticity); // Inverse relationship
    
    return currentPrice * (1 + priceAdjustment * 0.1); // Limit adjustment to 10% * factor
  }

  private applyMarketAdjustments(basePrice: number, conditions: {
    competitivePosition: number;
    seasonalFactor: number;
    trendFactor: number;
  }): number {
    let adjustedPrice = basePrice;
    
    // Apply seasonal adjustment
    if (conditions.seasonalFactor > 1.2) {
      adjustedPrice *= 1.05; // 5% increase for high season
    } else if (conditions.seasonalFactor < 0.8) {
      adjustedPrice *= 0.95; // 5% decrease for low season
    }
    
    // Apply trend adjustment
    if (conditions.trendFactor > 1.1) {
      adjustedPrice *= 1.03; // 3% increase for positive trend
    } else if (conditions.trendFactor < 0.9) {
      adjustedPrice *= 0.97; // 3% decrease for negative trend
    }
    
    return adjustedPrice;
  }

  private applyPriceConstraints(calculatedPrice: number, currentPrice: number, item: any): number {
    // Maximum price change of 15% per optimization
    const maxIncrease = currentPrice * 1.15;
    const maxDecrease = currentPrice * 0.85;
    
    let constrainedPrice = Math.max(maxDecrease, Math.min(maxIncrease, calculatedPrice));
    
    // Minimum price constraint (cost + minimum margin)
    const minPrice = Number(item.rate) * 0.7 || currentPrice * 0.5; // At least 70% of list price or 50% of current
    constrainedPrice = Math.max(minPrice, constrainedPrice);
    
    // Round to reasonable increments
    if (constrainedPrice > 100) {
      constrainedPrice = Math.round(constrainedPrice); // Round to dollars
    } else if (constrainedPrice > 10) {
      constrainedPrice = Math.round(constrainedPrice * 4) / 4; // Round to quarters
    } else {
      constrainedPrice = Math.round(constrainedPrice * 20) / 20; // Round to nickels
    }
    
    return constrainedPrice;
  }

  async getPriceOptimizations(itemCodes?: string[]): Promise<PriceOptimization[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const optimizations: PriceOptimization[] = [];

    try {
      // Get all items if none specified
      if (!itemCodes) {
        const items = await this.fyo.db.getAllRaw(ModelNameEnum.Item);
        itemCodes = items.map(item => item.name);
      }

      for (const itemCode of itemCodes) {
        const optimization = await this.generatePriceOptimization(itemCode);
        if (optimization) {
          optimizations.push(optimization);
        }
      }
    } catch (error) {
      console.error('Error generating price optimizations:', error);
    }

    return optimizations.sort((a, b) => Math.abs(b.priceChangePercent) - Math.abs(a.priceChangePercent));
  }

  private async generatePriceOptimization(itemCode: string): Promise<PriceOptimization | null> {
    try {
      const item = await this.fyo.db.get(ModelNameEnum.Item, itemCode);
      if (!item) return null;

      const currentPrice = await this.getCurrentPrice(itemCode);
      if (currentPrice === 0) return null;

      // Get recent sales to estimate current demand
      const recentSales = await this.getRecentSalesData(itemCode, 7);
      const currentDemand = recentSales.reduce((sum, sale) => sum + (Number(sale.quantity) || 0), 0);

      const recommendedPrice = await this.calculateOptimalPrice(itemCode, currentDemand);
      if (recommendedPrice === 0) return null;

      const priceChange = recommendedPrice - currentPrice;
      const priceChangePercent = (priceChange / currentPrice) * 100;
      
      // Skip if change is less than 1%
      if (Math.abs(priceChangePercent) < 1) return null;

      const elasticity = this.priceElasticityMap.get(itemCode) || -0.5;
      const expectedImpact = this.calculateExpectedImpact(currentPrice, recommendedPrice, elasticity, currentDemand);
      
      const confidence = this.calculateConfidence(itemCode, recentSales.length);
      const reason = this.generateOptimizationReason(priceChangePercent, elasticity, currentDemand);

      return {
        itemCode,
        itemName: item.itemName || itemCode,
        currentPrice,
        recommendedPrice,
        priceChange,
        priceChangePercent,
        confidence,
        reason,
        expectedImpact
      };
    } catch (error) {
      console.error(`Error generating optimization for ${itemCode}:`, error);
      return null;
    }
  }

  private calculateExpectedImpact(currentPrice: number, newPrice: number, elasticity: number, currentDemand: number): {
    demandChange: number;
    revenueChange: number;
    profitChange: number;
  } {
    const priceChangePercent = (newPrice - currentPrice) / currentPrice;
    const demandChangePercent = elasticity * priceChangePercent;
    const newDemand = currentDemand * (1 + demandChangePercent);
    
    const currentRevenue = currentPrice * currentDemand;
    const newRevenue = newPrice * newDemand;
    const revenueChange = ((newRevenue - currentRevenue) / currentRevenue) * 100;
    
    // Simplified profit calculation (assuming 30% margin)
    const profitMargin = 0.3;
    const currentProfit = currentRevenue * profitMargin;
    const newProfit = newRevenue * profitMargin;
    const profitChange = ((newProfit - currentProfit) / currentProfit) * 100;

    return {
      demandChange: demandChangePercent * 100,
      revenueChange,
      profitChange
    };
  }

  private calculateConfidence(itemCode: string, salesDataPoints: number): number {
    // Confidence based on data availability and elasticity reliability
    let confidence = 0.5; // Base confidence
    
    // More data points = higher confidence
    if (salesDataPoints > 50) confidence += 0.3;
    else if (salesDataPoints > 20) confidence += 0.2;
    else if (salesDataPoints > 10) confidence += 0.1;
    
    // Historical price changes improve confidence
    const elasticity = this.priceElasticityMap.get(itemCode) || -0.5;
    if (Math.abs(elasticity) > 0.1) confidence += 0.2; // Measurable elasticity
    
    return Math.min(1.0, confidence);
  }

  private generateOptimizationReason(priceChangePercent: number, elasticity: number, currentDemand: number): string {
    const reasons = [];
    
    if (priceChangePercent > 0) {
      if (currentDemand > 0) reasons.push('Strong demand supports price increase');
      if (Math.abs(elasticity) < 0.3) reasons.push('Low price sensitivity allows for higher prices');
      reasons.push('Market conditions favor price optimization');
    } else {
      if (currentDemand === 0) reasons.push('Low demand suggests price reduction needed');
      if (Math.abs(elasticity) > 1.0) reasons.push('High price sensitivity requires competitive pricing');
      reasons.push('Price reduction may stimulate demand');
    }
    
    return reasons.join('; ');
  }

  async getPriceElasticities(itemCodes?: string[]): Promise<PriceElasticity[]> {
    const elasticities: PriceElasticity[] = [];
    
    const codes = itemCodes || Array.from(this.priceElasticityMap.keys());
    
    for (const itemCode of codes) {
      const elasticity = this.priceElasticityMap.get(itemCode) || -0.5;
      const currentPrice = await this.getCurrentPrice(itemCode);
      
      let demandSensitivity: 'low' | 'medium' | 'high';
      if (Math.abs(elasticity) < 0.5) demandSensitivity = 'low';
      else if (Math.abs(elasticity) < 1.0) demandSensitivity = 'medium';
      else demandSensitivity = 'high';
      
      const optimalPriceRange = {
        min: currentPrice * 0.8,
        max: currentPrice * 1.2
      };
      
      elasticities.push({
        itemCode,
        elasticity,
        demandSensitivity,
        optimalPriceRange
      });
    }
    
    return elasticities;
  }

  async updateModel(): Promise<void> {
    console.log('Updating dynamic pricing model...');
    await this.calculatePriceElasticities();
  }

  async shutdown(): Promise<void> {
    this.priceElasticityMap.clear();
    this.isInitialized = false;
  }
}