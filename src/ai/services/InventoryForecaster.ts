import * as tf from '@tensorflow/tfjs';
import { Fyo } from 'fyo';
import { AIConfig } from '../index';
import { ModelNameEnum } from 'models/types';
import * as ss from 'simple-statistics';

export interface DemandPrediction {
  itemCode: string;
  predictedDemand: number;
  confidence: number;
  recommendedReorderPoint: number;
  recommendedOrderQuantity: number;
  seasonalityFactor: number;
}

export interface InventoryAlert {
  itemCode: string;
  itemName: string;
  currentStock: number;
  predictedDemand: number;
  daysToStockout: number;
  urgency: 'critical' | 'warning' | 'normal';
  recommendedAction: string;
}

export class InventoryForecaster {
  private fyo: Fyo;
  private config: AIConfig;
  private model: tf.LayersModel | null = null;
  private isModelLoaded = false;
  private trainingData: Array<{ features: number[]; label: number }> = [];

  constructor(fyo: Fyo, config: AIConfig) {
    this.fyo = fyo;
    this.config = config;
  }

  async initialize(): Promise<void> {
    console.log('Initializing Inventory Forecaster...');
    
    try {
      await this.loadOrCreateModel();
      await this.prepareTrainingData();
      
      if (this.trainingData.length > 0) {
        await this.trainModel();
      }
      
      this.isModelLoaded = true;
      console.log('Inventory Forecaster initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Inventory Forecaster:', error);
      throw error;
    }
  }

  private async loadOrCreateModel(): Promise<void> {
    try {
      // Try to load existing model from storage
      const modelPath = 'localstorage://inventory-forecaster-model';
      this.model = await tf.loadLayersModel(modelPath);
      console.log('Loaded existing inventory forecasting model');
    } catch (error) {
      // Create new model if none exists
      console.log('Creating new inventory forecasting model');
      this.model = this.createModel();
    }
  }

  private createModel(): tf.LayersModel {
    const model = tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [8], // Features: day_of_week, day_of_month, month, season, trend, recent_avg, price, promotions
          units: 64,
          activation: 'relu'
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({
          units: 32,
          activation: 'relu'
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({
          units: 16,
          activation: 'relu'
        }),
        tf.layers.dense({
          units: 1,
          activation: 'linear' // Regression output for demand quantity
        })
      ]
    });

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
      metrics: ['mae']
    });

    return model;
  }

  private async prepareTrainingData(): Promise<void> {
    try {
      // Get historical sales data for the last 2 years
      const salesData = await this.fyo.db.getAllRaw(ModelNameEnum.SalesInvoiceItem, {
        filters: {
          date: ['>=', new Date(Date.now() - 730 * 24 * 60 * 60 * 1000)] // 2 years ago
        },
        orderBy: 'date'
      });

      const groupedData = this.groupSalesByItemAndDate(salesData);
      
      for (const [itemCode, dailySales] of Object.entries(groupedData)) {
        const features = this.extractFeatures(itemCode, dailySales);
        this.trainingData.push(...features);
      }

      console.log(`Prepared ${this.trainingData.length} training samples`);
    } catch (error) {
      console.error('Error preparing training data:', error);
    }
  }

  private groupSalesByItemAndDate(salesData: any[]): Record<string, Array<{ date: Date; quantity: number; rate: number }>> {
    const grouped: Record<string, Array<{ date: Date; quantity: number; rate: number }>> = {};

    for (const sale of salesData) {
      const itemCode = sale.item;
      const date = new Date(sale.date);
      const quantity = Number(sale.quantity) || 0;
      const rate = Number(sale.rate) || 0;

      if (!grouped[itemCode]) {
        grouped[itemCode] = [];
      }

      grouped[itemCode].push({ date, quantity, rate });
    }

    return grouped;
  }

  private extractFeatures(itemCode: string, dailySales: Array<{ date: Date; quantity: number; rate: number }>): Array<{ features: number[]; label: number }> {
    const features: Array<{ features: number[]; label: number }> = [];
    
    if (dailySales.length < 30) return features; // Need at least 30 days of data

    for (let i = 30; i < dailySales.length; i++) {
      const currentSale = dailySales[i];
      const recentSales = dailySales.slice(i - 30, i);
      
      const dayOfWeek = currentSale.date.getDay();
      const dayOfMonth = currentSale.date.getDate();
      const month = currentSale.date.getMonth();
      const season = this.getSeason(month);
      const trend = this.calculateTrend(recentSales);
      const recentAvg = ss.mean(recentSales.map(s => s.quantity));
      const price = currentSale.rate;
      const promotions = this.detectPromotions(recentSales);

      const featureVector = [
        dayOfWeek / 7,
        dayOfMonth / 31,
        month / 12,
        season,
        trend,
        recentAvg / 100, // Normalize
        price / 1000, // Normalize
        promotions
      ];

      features.push({
        features: featureVector,
        label: currentSale.quantity
      });
    }

    return features;
  }

  private getSeason(month: number): number {
    // 0: Spring, 0.33: Summer, 0.66: Fall, 1: Winter
    if (month >= 2 && month <= 4) return 0;      // Spring
    if (month >= 5 && month <= 7) return 0.33;   // Summer
    if (month >= 8 && month <= 10) return 0.66;  // Fall
    return 1;                                     // Winter
  }

  private calculateTrend(recentSales: Array<{ date: Date; quantity: number }>): number {
    if (recentSales.length < 7) return 0;

    const firstWeek = ss.mean(recentSales.slice(0, 7).map(s => s.quantity));
    const lastWeek = ss.mean(recentSales.slice(-7).map(s => s.quantity));
    
    return (lastWeek - firstWeek) / (firstWeek || 1); // Normalized trend
  }

  private detectPromotions(recentSales: Array<{ rate: number }>): number {
    if (recentSales.length < 14) return 0;

    const avgPrice = ss.mean(recentSales.map(s => s.rate));
    const recentPrice = ss.mean(recentSales.slice(-7).map(s => s.rate));
    
    const priceReduction = (avgPrice - recentPrice) / avgPrice;
    return priceReduction > 0.1 ? 1 : 0; // 1 if price reduced by more than 10%
  }

  private async trainModel(): Promise<void> {
    if (!this.model || this.trainingData.length === 0) return;

    console.log('Training inventory forecasting model...');

    const xs = tf.tensor2d(this.trainingData.map(d => d.features));
    const ys = tf.tensor2d(this.trainingData.map(d => [d.label]));

    await this.model.fit(xs, ys, {
      epochs: 50,
      batchSize: 32,
      validationSplit: 0.2,
      verbose: 0,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          if (epoch % 10 === 0) {
            console.log(`Epoch ${epoch}: loss = ${logs?.loss?.toFixed(4)}`);
          }
        }
      }
    });

    // Save the trained model
    await this.model.save('localstorage://inventory-forecaster-model');
    
    xs.dispose();
    ys.dispose();
    
    console.log('Inventory forecasting model training completed');
  }

  async predictDemand(itemCode: string, days: number = 30): Promise<number> {
    if (!this.isModelLoaded || !this.model) {
      console.warn('Inventory forecaster not initialized');
      return 0;
    }

    try {
      // Get recent sales data for the item
      const recentSales = await this.getRecentSalesData(itemCode, 60);
      
      if (recentSales.length === 0) {
        return 0; // No historical data
      }

      let totalPrediction = 0;
      const startDate = new Date();

      for (let i = 0; i < days; i++) {
        const targetDate = new Date(startDate);
        targetDate.setDate(startDate.getDate() + i);
        
        const features = await this.createPredictionFeatures(itemCode, targetDate, recentSales);
        const prediction = await this.model.predict(tf.tensor2d([features])) as tf.Tensor;
        const value = await prediction.data();
        
        totalPrediction += Math.max(0, value[0]); // Ensure non-negative demand
        prediction.dispose();
      }

      return Math.round(totalPrediction);
    } catch (error) {
      console.error('Error predicting demand:', error);
      return 0;
    }
  }

  private async getRecentSalesData(itemCode: string, days: number): Promise<Array<{ date: Date; quantity: number; rate: number }>> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const salesData = await this.fyo.db.getAllRaw(ModelNameEnum.SalesInvoiceItem, {
        filters: {
          item: itemCode,
          date: ['>=', cutoffDate]
        },
        orderBy: 'date'
      });

      return salesData.map(sale => ({
        date: new Date(sale.date),
        quantity: Number(sale.quantity) || 0,
        rate: Number(sale.rate) || 0
      }));
    } catch (error) {
      console.error('Error fetching recent sales data:', error);
      return [];
    }
  }

  private async createPredictionFeatures(itemCode: string, targetDate: Date, recentSales: Array<{ date: Date; quantity: number; rate: number }>): Promise<number[]> {
    const dayOfWeek = targetDate.getDay();
    const dayOfMonth = targetDate.getDate();
    const month = targetDate.getMonth();
    const season = this.getSeason(month);
    
    const trend = recentSales.length > 7 ? this.calculateTrend(recentSales.slice(-30)) : 0;
    const recentAvg = recentSales.length > 0 ? ss.mean(recentSales.slice(-30).map(s => s.quantity)) : 0;
    const avgPrice = recentSales.length > 0 ? ss.mean(recentSales.map(s => s.rate)) : 0;
    const promotions = recentSales.length > 14 ? this.detectPromotions(recentSales.slice(-14)) : 0;

    return [
      dayOfWeek / 7,
      dayOfMonth / 31,
      month / 12,
      season,
      trend,
      recentAvg / 100,
      avgPrice / 1000,
      promotions
    ];
  }

  async getDemandPredictions(itemCodes?: string[]): Promise<DemandPrediction[]> {
    const predictions: DemandPrediction[] = [];
    
    // Get all items if none specified
    if (!itemCodes) {
      const items = await this.fyo.db.getAllRaw(ModelNameEnum.Item);
      itemCodes = items.map(item => item.name);
    }

    for (const itemCode of itemCodes) {
      const predictedDemand = await this.predictDemand(itemCode, 30);
      const confidence = await this.calculatePredictionConfidence(itemCode);
      const { reorderPoint, orderQuantity } = await this.calculateReorderRecommendations(itemCode, predictedDemand);
      const seasonalityFactor = await this.calculateSeasonalityFactor(itemCode);

      predictions.push({
        itemCode,
        predictedDemand,
        confidence,
        recommendedReorderPoint: reorderPoint,
        recommendedOrderQuantity: orderQuantity,
        seasonalityFactor
      });
    }

    return predictions.sort((a, b) => b.predictedDemand - a.predictedDemand);
  }

  async getInventoryAlerts(): Promise<InventoryAlert[]> {
    const alerts: InventoryAlert[] = [];
    
    try {
      // Get all items with current stock levels
      const stockData = await this.fyo.db.getAllRaw('StockLedgerEntry', {
        fields: ['item', 'quantity'],
        orderBy: 'date DESC'
      });

      const currentStock = this.calculateCurrentStock(stockData);
      
      for (const [itemCode, stock] of Object.entries(currentStock)) {
        const predictedDemand = await this.predictDemand(itemCode, 7); // 7-day prediction
        const dailyDemand = predictedDemand / 7;
        const daysToStockout = dailyDemand > 0 ? stock / dailyDemand : Infinity;
        
        let urgency: 'critical' | 'warning' | 'normal' = 'normal';
        let recommendedAction = 'Monitor stock levels';
        
        if (daysToStockout < 3) {
          urgency = 'critical';
          recommendedAction = 'Immediate reorder required - stock will run out in < 3 days';
        } else if (daysToStockout < 7) {
          urgency = 'warning';
          recommendedAction = 'Reorder soon - stock will run out within a week';
        }

        if (urgency !== 'normal') {
          const item = await this.fyo.db.get(ModelNameEnum.Item, itemCode);
          
          alerts.push({
            itemCode,
            itemName: item?.itemName || itemCode,
            currentStock: stock,
            predictedDemand,
            daysToStockout: Math.round(daysToStockout),
            urgency,
            recommendedAction
          });
        }
      }
    } catch (error) {
      console.error('Error generating inventory alerts:', error);
    }

    return alerts.sort((a, b) => {
      const urgencyOrder = { critical: 0, warning: 1, normal: 2 };
      return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    });
  }

  private calculateCurrentStock(stockEntries: any[]): Record<string, number> {
    const stock: Record<string, number> = {};
    
    for (const entry of stockEntries) {
      const itemCode = entry.item;
      const quantity = Number(entry.quantity) || 0;
      
      if (!stock[itemCode]) {
        stock[itemCode] = 0;
      }
      
      stock[itemCode] += quantity;
    }
    
    return stock;
  }

  private async calculatePredictionConfidence(itemCode: string): Promise<number> {
    // Simplified confidence calculation based on data availability and model performance
    const recentSales = await this.getRecentSalesData(itemCode, 90);
    
    if (recentSales.length < 30) return 0.3; // Low confidence
    if (recentSales.length < 60) return 0.6; // Medium confidence
    return 0.9; // High confidence
  }

  private async calculateReorderRecommendations(itemCode: string, predictedDemand: number): Promise<{ reorderPoint: number; orderQuantity: number }> {
    // Simple reorder calculation - can be enhanced with supplier lead times, safety stock, etc.
    const leadTimeDays = 7; // Default lead time
    const safetyStockDays = 5; // Safety stock
    
    const dailyDemand = predictedDemand / 30;
    const reorderPoint = Math.ceil(dailyDemand * (leadTimeDays + safetyStockDays));
    const orderQuantity = Math.ceil(dailyDemand * 30); // 30 days worth of stock
    
    return { reorderPoint, orderQuantity };
  }

  private async calculateSeasonalityFactor(itemCode: string): Promise<number> {
    const yearlyData = await this.getRecentSalesData(itemCode, 365);
    
    if (yearlyData.length < 90) return 1; // No seasonality data
    
    const monthlyDemand: Record<number, number[]> = {};
    
    for (const sale of yearlyData) {
      const month = sale.date.getMonth();
      if (!monthlyDemand[month]) monthlyDemand[month] = [];
      monthlyDemand[month].push(sale.quantity);
    }
    
    const monthlyAvg = Object.entries(monthlyDemand).map(([month, quantities]) => ({
      month: Number(month),
      avg: ss.mean(quantities)
    }));
    
    if (monthlyAvg.length < 6) return 1; // Not enough data
    
    const overallAvg = ss.mean(monthlyAvg.map(m => m.avg));
    const currentMonth = new Date().getMonth();
    const currentMonthData = monthlyAvg.find(m => m.month === currentMonth);
    
    return currentMonthData ? currentMonthData.avg / overallAvg : 1;
  }

  async updateModel(): Promise<void> {
    console.log('Updating inventory forecasting model...');
    
    await this.prepareTrainingData();
    
    if (this.trainingData.length > 0) {
      await this.trainModel();
    }
  }

  async shutdown(): Promise<void> {
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
    this.isModelLoaded = false;
    this.trainingData = [];
  }
}