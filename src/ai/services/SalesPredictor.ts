import * as tf from '@tensorflow/tfjs';
import { Fyo } from 'fyo';
import { AIConfig } from '../index';
import { ModelNameEnum } from 'models/types';
import * as ss from 'simple-statistics';

export interface SalesForcast {
  date: string;
  predicted_sales: number;
  predicted_revenue: number;
  confidence_interval: {
    lower: number;
    upper: number;
  };
  factors: {
    trend: number;
    seasonal: number;
    external: number;
  };
}

export interface PeakHourAnalysis {
  hour: number;
  averageSales: number;
  peakProbability: number;
  recommendedStaffing: number;
}

export interface RevenueProjection {
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  projectedRevenue: number;
  actualRevenue?: number;
  variance?: number;
  confidence: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export class SalesPredictor {
  private fyo: Fyo;
  private config: AIConfig;
  private model: tf.LayersModel | null = null;
  private isModelLoaded = false;
  private historicalData: Array<{ date: Date; sales: number; revenue: number }> = [];
  private seasonalPatterns: Map<string, number> = new Map();

  constructor(fyo: Fyo, config: AIConfig) {
    this.fyo = fyo;
    this.config = config;
  }

  async initialize(): Promise<void> {
    console.log('Initializing Sales Predictor...');
    
    try {
      await this.loadOrCreateModel();
      await this.loadHistoricalData();
      await this.analyzeSeasonalPatterns();
      await this.trainModel();
      
      this.isModelLoaded = true;
      console.log('Sales Predictor initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Sales Predictor:', error);
      throw error;
    }
  }

  private async loadOrCreateModel(): Promise<void> {
    try {
      this.model = await tf.loadLayersModel('localstorage://sales-prediction-model');
      console.log('Loaded existing sales prediction model');
    } catch (error) {
      console.log('Creating new sales prediction model');
      this.model = this.createModel();
    }
  }

  private createModel(): tf.LayersModel {
    const model = tf.sequential({
      layers: [
        // LSTM layer for time series prediction
        tf.layers.lstm({
          inputShape: [30, 8], // 30 days lookback, 8 features per day
          units: 64,
          returnSequences: true,
          dropout: 0.2,
          recurrentDropout: 0.2
        }),
        tf.layers.lstm({
          units: 32,
          returnSequences: false,
          dropout: 0.2,
          recurrentDropout: 0.2
        }),
        tf.layers.dense({
          units: 16,
          activation: 'relu'
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({
          units: 1,
          activation: 'linear' // Regression for sales prediction
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

  private async loadHistoricalData(): Promise<void> {
    try {
      // Get sales data for the last 2 years
      const salesInvoices = await this.fyo.db.getAllRaw(ModelNameEnum.SalesInvoice, {
        filters: {
          date: ['>=', new Date(Date.now() - 730 * 24 * 60 * 60 * 1000)] // 2 years
        },
        orderBy: 'date'
      });

      // Group by date and aggregate
      const dailyData = this.groupSalesByDate(salesInvoices);
      this.historicalData = this.fillMissingDates(dailyData);
      
      console.log(`Loaded ${this.historicalData.length} days of historical sales data`);
    } catch (error) {
      console.error('Error loading historical data:', error);
    }
  }

  private groupSalesByDate(invoices: any[]): Array<{ date: Date; sales: number; revenue: number }> {
    const grouped: Record<string, { sales: number; revenue: number }> = {};

    for (const invoice of invoices) {
      const dateKey = new Date(invoice.date).toISOString().split('T')[0];
      const revenue = Number(invoice.grandTotal) || 0;

      if (!grouped[dateKey]) {
        grouped[dateKey] = { sales: 0, revenue: 0 };
      }

      grouped[dateKey].sales += 1;
      grouped[dateKey].revenue += revenue;
    }

    return Object.entries(grouped).map(([dateStr, data]) => ({
      date: new Date(dateStr),
      sales: data.sales,
      revenue: data.revenue
    })).sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  private fillMissingDates(data: Array<{ date: Date; sales: number; revenue: number }>): Array<{ date: Date; sales: number; revenue: number }> {
    if (data.length === 0) return [];

    const filled = [];
    const startDate = new Date(data[0].date);
    const endDate = new Date(data[data.length - 1].date);
    
    let currentDate = new Date(startDate);
    let dataIndex = 0;

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      
      if (dataIndex < data.length && data[dataIndex].date.toISOString().split('T')[0] === dateStr) {
        filled.push(data[dataIndex]);
        dataIndex++;
      } else {
        // Fill missing date with zero sales
        filled.push({
          date: new Date(currentDate),
          sales: 0,
          revenue: 0
        });
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return filled;
  }

  private async analyzeSeasonalPatterns(): Promise<void> {
    if (this.historicalData.length < 90) return; // Need at least 3 months

    // Monthly patterns
    const monthlyData: Record<number, number[]> = {};
    for (const data of this.historicalData) {
      const month = data.date.getMonth();
      if (!monthlyData[month]) monthlyData[month] = [];
      monthlyData[month].push(data.sales);
    }

    const overallMonthlySales = ss.mean(this.historicalData.map(d => d.sales));
    for (const [month, salesData] of Object.entries(monthlyData)) {
      const monthAvg = ss.mean(salesData);
      const seasonalFactor = monthAvg / overallMonthlySales;
      this.seasonalPatterns.set(`month_${month}`, seasonalFactor);
    }

    // Day of week patterns
    const weekdayData: Record<number, number[]> = {};
    for (const data of this.historicalData) {
      const dayOfWeek = data.date.getDay();
      if (!weekdayData[dayOfWeek]) weekdayData[dayOfWeek] = [];
      weekdayData[dayOfWeek].push(data.sales);
    }

    const overallDailySales = ss.mean(this.historicalData.map(d => d.sales));
    for (const [dayOfWeek, salesData] of Object.entries(weekdayData)) {
      const dayAvg = ss.mean(salesData);
      const seasonalFactor = dayAvg / overallDailySales;
      this.seasonalPatterns.set(`weekday_${dayOfWeek}`, seasonalFactor);
    }

    console.log('Analyzed seasonal patterns for sales prediction');
  }

  private async trainModel(): Promise<void> {
    if (!this.model || this.historicalData.length < 60) {
      console.log('Insufficient data for sales prediction model training');
      return;
    }

    console.log('Training sales prediction model...');

    const trainingData = this.prepareTrainingData();
    
    if (trainingData.features.length === 0) return;

    const xs = tf.tensor3d(trainingData.features);
    const ys = tf.tensor2d(trainingData.labels);

    await this.model.fit(xs, ys, {
      epochs: 50,
      batchSize: 16,
      validationSplit: 0.2,
      verbose: 0,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          if (epoch % 10 === 0) {
            console.log(`Sales model epoch ${epoch}: loss = ${logs?.loss?.toFixed(4)}`);
          }
        }
      }
    });

    await this.model.save('localstorage://sales-prediction-model');
    
    xs.dispose();
    ys.dispose();
    
    console.log('Sales prediction model training completed');
  }

  private prepareTrainingData(): { features: number[][][]; labels: number[][] } {
    const features: number[][][] = [];
    const labels: number[][] = [];
    const lookbackDays = 30;

    for (let i = lookbackDays; i < this.historicalData.length; i++) {
      const sequenceFeatures: number[][] = [];
      
      for (let j = i - lookbackDays; j < i; j++) {
        const data = this.historicalData[j];
        const featureVector = this.extractDateFeatures(data.date, data.sales, data.revenue);
        sequenceFeatures.push(featureVector);
      }

      features.push(sequenceFeatures);
      labels.push([this.historicalData[i].sales]);
    }

    return { features, labels };
  }

  private extractDateFeatures(date: Date, sales: number, revenue: number): number[] {
    const dayOfWeek = date.getDay();
    const dayOfMonth = date.getDate();
    const month = date.getMonth();
    const dayOfYear = this.getDayOfYear(date);
    
    const weekdayFactor = this.seasonalPatterns.get(`weekday_${dayOfWeek}`) || 1;
    const monthlyFactor = this.seasonalPatterns.get(`month_${month}`) || 1;
    
    // Moving averages
    const ma7 = this.getMovingAverage(date, 7);
    const ma30 = this.getMovingAverage(date, 30);

    return [
      dayOfWeek / 7,           // Normalized day of week
      dayOfMonth / 31,         // Normalized day of month
      month / 12,              // Normalized month
      Math.sin(2 * Math.PI * dayOfYear / 365), // Seasonal sine
      Math.cos(2 * Math.PI * dayOfYear / 365), // Seasonal cosine
      weekdayFactor,           // Weekday seasonal factor
      monthlyFactor,           // Monthly seasonal factor
      sales / 100              // Normalized sales (current day)
    ];
  }

  private getDayOfYear(date: Date): number {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date.getTime() - start.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  private getMovingAverage(date: Date, days: number): number {
    const endIndex = this.historicalData.findIndex(d => d.date >= date);
    if (endIndex < days) return 0;

    const relevantData = this.historicalData.slice(endIndex - days, endIndex);
    return ss.mean(relevantData.map(d => d.sales));
  }

  async predictSales(days: number = 7): Promise<SalesForcast[]> {
    if (!this.isModelLoaded || !this.model) {
      console.warn('Sales predictor not initialized');
      return [];
    }

    const forecasts: SalesForcast[] = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 1); // Start from tomorrow

    try {
      // Get the last 30 days of data for prediction context
      const contextData = this.historicalData.slice(-30);
      
      for (let i = 0; i < days; i++) {
        const targetDate = new Date(startDate);
        targetDate.setDate(startDate.getDate() + i);
        
        const prediction = await this.predictSingleDay(targetDate, contextData);
        forecasts.push(prediction);
        
        // Add prediction to context for next day (rolling prediction)
        contextData.push({
          date: targetDate,
          sales: prediction.predicted_sales,
          revenue: prediction.predicted_revenue
        });
        
        // Keep only last 30 days
        if (contextData.length > 30) {
          contextData.shift();
        }
      }
    } catch (error) {
      console.error('Error predicting sales:', error);
    }

    return forecasts;
  }

  private async predictSingleDay(date: Date, contextData: Array<{ date: Date; sales: number; revenue: number }>): Promise<SalesForcast> {
    if (!this.model) {
      throw new Error('Model not loaded');
    }

    // Prepare features for prediction
    const sequenceFeatures: number[][] = [];
    
    for (let i = Math.max(0, contextData.length - 30); i < contextData.length; i++) {
      const data = contextData[i];
      const featureVector = this.extractDateFeatures(data.date, data.sales, data.revenue);
      sequenceFeatures.push(featureVector);
    }

    // Pad if we don't have enough context
    while (sequenceFeatures.length < 30) {
      sequenceFeatures.unshift(new Array(8).fill(0));
    }

    const prediction = await this.model.predict(tf.tensor3d([sequenceFeatures])) as tf.Tensor;
    const salesPrediction = await prediction.data();
    
    prediction.dispose();
    
    const predicted_sales = Math.max(0, salesPrediction[0]);
    const predicted_revenue = this.estimateRevenue(predicted_sales);
    
    // Calculate confidence interval (simplified)
    const confidence = this.calculatePredictionConfidence(date, contextData);
    const margin = predicted_sales * (1 - confidence) * 0.5;
    
    const factors = this.calculatePredictionFactors(date);

    return {
      date: date.toISOString().split('T')[0],
      predicted_sales: Math.round(predicted_sales),
      predicted_revenue: Math.round(predicted_revenue * 100) / 100,
      confidence_interval: {
        lower: Math.max(0, Math.round(predicted_sales - margin)),
        upper: Math.round(predicted_sales + margin)
      },
      factors
    };
  }

  private estimateRevenue(predictedSales: number): number {
    // Use historical average revenue per sale
    if (this.historicalData.length === 0) return 0;
    
    const totalSales = this.historicalData.reduce((sum, d) => sum + d.sales, 0);
    const totalRevenue = this.historicalData.reduce((sum, d) => sum + d.revenue, 0);
    
    const avgRevenuePerSale = totalSales > 0 ? totalRevenue / totalSales : 0;
    return predictedSales * avgRevenuePerSale;
  }

  private calculatePredictionConfidence(date: Date, contextData: Array<{ date: Date; sales: number; revenue: number }>): number {
    let confidence = 0.7; // Base confidence
    
    // More recent data = higher confidence
    if (contextData.length >= 30) confidence += 0.15;
    else if (contextData.length >= 14) confidence += 0.1;
    
    // Historical patterns for this day type increase confidence
    const dayOfWeek = date.getDay();
    const weekdayFactor = this.seasonalPatterns.get(`weekday_${dayOfWeek}`);
    if (weekdayFactor && weekdayFactor > 0.1) confidence += 0.1;
    
    // Stable recent trends increase confidence
    if (contextData.length >= 7) {
      const recentSales = contextData.slice(-7).map(d => d.sales);
      const variance = ss.variance(recentSales);
      const mean = ss.mean(recentSales);
      const cv = mean > 0 ? Math.sqrt(variance) / mean : 1;
      
      if (cv < 0.3) confidence += 0.05; // Low variability
    }
    
    return Math.min(1, confidence);
  }

  private calculatePredictionFactors(date: Date): { trend: number; seasonal: number; external: number } {
    const dayOfWeek = date.getDay();
    const month = date.getMonth();
    
    const weekdayFactor = this.seasonalPatterns.get(`weekday_${dayOfWeek}`) || 1;
    const monthlyFactor = this.seasonalPatterns.get(`month_${month}`) || 1;
    
    // Calculate trend from recent data
    const recentData = this.historicalData.slice(-30);
    const trendFactor = this.calculateTrendFactor(recentData);
    
    return {
      trend: trendFactor,
      seasonal: weekdayFactor * monthlyFactor,
      external: 1.0 // Would include external factors like holidays, events, etc.
    };
  }

  private calculateTrendFactor(data: Array<{ date: Date; sales: number; revenue: number }>): number {
    if (data.length < 14) return 1;
    
    const firstHalf = data.slice(0, Math.floor(data.length / 2));
    const secondHalf = data.slice(Math.floor(data.length / 2));
    
    const firstAvg = ss.mean(firstHalf.map(d => d.sales));
    const secondAvg = ss.mean(secondHalf.map(d => d.sales));
    
    return firstAvg > 0 ? secondAvg / firstAvg : 1;
  }

  async getPeakHourAnalysis(): Promise<PeakHourAnalysis[]> {
    try {
      // This would require hourly sales data
      // For now, return a simplified analysis based on typical retail patterns
      const analysis: PeakHourAnalysis[] = [];
      
      // Typical retail peak hours
      const hourlyPatterns = [
        { hour: 8, multiplier: 0.3 },   // 8 AM
        { hour: 9, multiplier: 0.5 },   // 9 AM
        { hour: 10, multiplier: 0.7 },  // 10 AM
        { hour: 11, multiplier: 0.9 },  // 11 AM
        { hour: 12, multiplier: 1.2 },  // 12 PM - Lunch peak
        { hour: 13, multiplier: 1.1 },  // 1 PM
        { hour: 14, multiplier: 0.8 },  // 2 PM
        { hour: 15, multiplier: 0.9 },  // 3 PM
        { hour: 16, multiplier: 1.0 },  // 4 PM
        { hour: 17, multiplier: 1.3 },  // 5 PM - Evening peak
        { hour: 18, multiplier: 1.1 },  // 6 PM
        { hour: 19, multiplier: 0.8 },  // 7 PM
        { hour: 20, multiplier: 0.6 },  // 8 PM
        { hour: 21, multiplier: 0.4 }   // 9 PM
      ];
      
      const avgDailySales = this.historicalData.length > 0 ? 
        ss.mean(this.historicalData.map(d => d.sales)) : 50;
      
      for (const pattern of hourlyPatterns) {
        const averageSales = avgDailySales * pattern.multiplier / 14; // Distribute across operating hours
        const peakProbability = pattern.multiplier > 1.0 ? pattern.multiplier - 1.0 : 0;
        const recommendedStaffing = Math.max(1, Math.round(pattern.multiplier * 2));
        
        analysis.push({
          hour: pattern.hour,
          averageSales: Math.round(averageSales * 100) / 100,
          peakProbability: Math.round(peakProbability * 100) / 100,
          recommendedStaffing
        });
      }
      
      return analysis;
    } catch (error) {
      console.error('Error analyzing peak hours:', error);
      return [];
    }
  }

  async getRevenueProjections(): Promise<RevenueProjection[]> {
    try {
      const projections: RevenueProjection[] = [];
      const now = new Date();
      
      // Daily projection
      const dailyForecast = await this.predictSales(1);
      if (dailyForecast.length > 0) {
        projections.push({
          period: 'daily',
          projectedRevenue: dailyForecast[0].predicted_revenue,
          confidence: this.calculatePredictionConfidence(new Date(dailyForecast[0].date), this.historicalData.slice(-30)),
          trend: this.determineTrend(this.historicalData.slice(-7).map(d => d.revenue))
        });
      }
      
      // Weekly projection
      const weeklyForecast = await this.predictSales(7);
      const weeklyRevenue = weeklyForecast.reduce((sum, f) => sum + f.predicted_revenue, 0);
      projections.push({
        period: 'weekly',
        projectedRevenue: Math.round(weeklyRevenue * 100) / 100,
        confidence: 0.8,
        trend: this.determineTrend(this.historicalData.slice(-30).map(d => d.revenue))
      });
      
      // Monthly projection (simplified)
      const monthlyRevenue = weeklyRevenue * 4.33; // Average weeks per month
      projections.push({
        period: 'monthly',
        projectedRevenue: Math.round(monthlyRevenue * 100) / 100,
        confidence: 0.7,
        trend: this.determineTrend(this.historicalData.slice(-90).map(d => d.revenue))
      });
      
      return projections;
    } catch (error) {
      console.error('Error generating revenue projections:', error);
      return [];
    }
  }

  private determineTrend(values: number[]): 'increasing' | 'decreasing' | 'stable' {
    if (values.length < 2) return 'stable';
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = ss.mean(firstHalf);
    const secondAvg = ss.mean(secondHalf);
    
    const change = (secondAvg - firstAvg) / firstAvg;
    
    if (change > 0.05) return 'increasing';
    if (change < -0.05) return 'decreasing';
    return 'stable';
  }

  async updateModel(): Promise<void> {
    console.log('Updating sales prediction model...');
    
    await this.loadHistoricalData();
    await this.analyzeSeasonalPatterns();
    
    if (this.historicalData.length >= 60) {
      await this.trainModel();
    }
  }

  async shutdown(): Promise<void> {
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
    this.isModelLoaded = false;
    this.historicalData = [];
    this.seasonalPatterns.clear();
  }
}