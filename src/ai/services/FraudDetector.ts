import * as tf from '@tensorflow/tfjs';
import { Fyo } from 'fyo';
import { AIConfig } from '../index';
import { ModelNameEnum } from 'models/types';
import * as ss from 'simple-statistics';

export interface FraudAnalysis {
  transactionId: string;
  isFraud: boolean;
  confidence: number;
  riskScore: number;
  reasons: string[];
  recommendations: string[];
}

export interface FraudPattern {
  patternType: string;
  description: string;
  frequency: number;
  severity: 'low' | 'medium' | 'high';
  examples: string[];
}

export class FraudDetector {
  private fyo: Fyo;
  private config: AIConfig;
  private model: tf.LayersModel | null = null;
  private isModelLoaded = false;
  private suspiciousPatterns: Set<string> = new Set();

  constructor(fyo: Fyo, config: AIConfig) {
    this.fyo = fyo;
    this.config = config;
  }

  async initialize(): Promise<void> {
    console.log('Initializing Fraud Detector...');
    
    try {
      await this.loadOrCreateModel();
      await this.trainModel();
      this.loadSuspiciousPatterns();
      
      this.isModelLoaded = true;
      console.log('Fraud Detector initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Fraud Detector:', error);
      throw error;
    }
  }

  private async loadOrCreateModel(): Promise<void> {
    try {
      this.model = await tf.loadLayersModel('localstorage://fraud-detection-model');
      console.log('Loaded existing fraud detection model');
    } catch (error) {
      console.log('Creating new fraud detection model');
      this.model = this.createModel();
    }
  }

  private createModel(): tf.LayersModel {
    const model = tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [12], // Transaction features
          units: 48,
          activation: 'relu'
        }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({
          units: 24,
          activation: 'relu'
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({
          units: 12,
          activation: 'relu'
        }),
        tf.layers.dense({
          units: 1,
          activation: 'sigmoid' // Binary classification for fraud
        })
      ]
    });

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy', 'precision', 'recall']
    });

    return model;
  }

  private loadSuspiciousPatterns(): void {
    // Load known suspicious patterns
    const patterns = [
      'round_numbers_only',
      'unusual_hour_transactions',
      'high_value_small_quantities',
      'rapid_successive_transactions',
      'unusual_location_pattern',
      'refund_fraud_pattern',
      'manual_price_override',
      'cash_only_high_value'
    ];

    patterns.forEach(pattern => this.suspiciousPatterns.add(pattern));
  }

  private async trainModel(): Promise<void> {
    if (!this.model) return;

    console.log('Training fraud detection model...');
    
    const trainingData = await this.prepareTrainingData();
    
    if (trainingData.length < 100) {
      console.log('Insufficient data for fraud model training');
      return;
    }

    const features = trainingData.map(d => d.features);
    const labels = trainingData.map(d => [d.isFraud ? 1 : 0]);

    const xs = tf.tensor2d(features);
    const ys = tf.tensor2d(labels);

    await this.model.fit(xs, ys, {
      epochs: 30,
      batchSize: 32,
      validationSplit: 0.2,
      verbose: 0,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          if (epoch % 10 === 0) {
            console.log(`Fraud model epoch ${epoch}: accuracy = ${logs?.acc?.toFixed(4)}`);
          }
        }
      }
    });

    await this.model.save('localstorage://fraud-detection-model');
    
    xs.dispose();
    ys.dispose();
    
    console.log('Fraud detection model training completed');
  }

  private async prepareTrainingData(): Promise<Array<{ features: number[]; isFraud: boolean }>> {
    try {
      const transactions = await this.fyo.db.getAllRaw(ModelNameEnum.SalesInvoice, {
        orderBy: 'date DESC',
        limit: 10000 // Last 10k transactions
      });

      const trainingData = [];

      for (const transaction of transactions) {
        const features = await this.extractTransactionFeatures(transaction);
        const isFraud = await this.isKnownFraud(transaction);
        
        trainingData.push({ features, isFraud });
      }

      return trainingData;
    } catch (error) {
      console.error('Error preparing fraud training data:', error);
      return [];
    }
  }

  private async extractTransactionFeatures(transaction: any): Promise<number[]> {
    const transactionDate = new Date(transaction.date);
    const hour = transactionDate.getHours();
    const dayOfWeek = transactionDate.getDay();
    const amount = Number(transaction.grandTotal) || 0;
    
    // Get transaction items
    const items = await this.fyo.db.getAllRaw(ModelNameEnum.SalesInvoiceItem, {
      filters: { parent: transaction.name }
    });

    const itemCount = items.length;
    const totalQuantity = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    const avgItemPrice = itemCount > 0 ? amount / itemCount : 0;
    const priceVariance = this.calculatePriceVariance(items);
    
    // Transaction pattern features
    const isRoundNumber = amount % 10 === 0 ? 1 : 0;
    const isUnusualHour = (hour < 8 || hour > 22) ? 1 : 0;
    const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6) ? 1 : 0;
    
    // Payment method analysis
    const paymentMethods = await this.getPaymentMethods(transaction.name);
    const isCashOnly = paymentMethods.length === 1 && paymentMethods[0] === 'Cash' ? 1 : 0;
    const hasMultiplePayments = paymentMethods.length > 1 ? 1 : 0;

    return [
      amount / 1000, // Normalized amount
      itemCount / 10, // Normalized item count
      totalQuantity / 50, // Normalized quantity
      avgItemPrice / 500, // Normalized avg price
      priceVariance,
      isRoundNumber,
      isUnusualHour,
      isWeekend,
      isCashOnly,
      hasMultiplePayments,
      hour / 24, // Normalized hour
      dayOfWeek / 7 // Normalized day of week
    ];
  }

  private calculatePriceVariance(items: any[]): number {
    if (items.length < 2) return 0;
    
    const prices = items.map(item => Number(item.rate) || 0);
    const mean = ss.mean(prices);
    const variance = ss.variance(prices);
    
    return variance / (mean || 1); // Normalized variance
  }

  private async getPaymentMethods(invoiceName: string): Promise<string[]> {
    try {
      const payments = await this.fyo.db.getAllRaw(ModelNameEnum.PaymentFor, {
        filters: { referenceName: invoiceName }
      });

      const methods = new Set<string>();
      
      for (const payment of payments) {
        const paymentDoc = await this.fyo.db.get(ModelNameEnum.Payment, payment.parent);
        if (paymentDoc?.paymentMethod) {
          methods.add(paymentDoc.paymentMethod);
        }
      }

      return Array.from(methods);
    } catch (error) {
      return ['Unknown'];
    }
  }

  private async isKnownFraud(transaction: any): Promise<boolean> {
    // In a real implementation, this would check against known fraud cases
    // For now, we'll use heuristics to create synthetic labels
    
    const amount = Number(transaction.grandTotal) || 0;
    const date = new Date(transaction.date);
    const hour = date.getHours();
    
    // Simple heuristics for training data
    if (amount > 10000 && hour < 6) return true; // High value late night
    if (transaction.isCancelled && amount > 5000) return true; // Large cancelled transactions
    
    return false; // Most transactions are legitimate
  }

  async analyzeTransaction(transactionData: any): Promise<FraudAnalysis> {
    if (!this.isModelLoaded || !this.model) {
      return {
        transactionId: transactionData.name || 'unknown',
        isFraud: false,
        confidence: 0,
        riskScore: 0,
        reasons: ['Fraud detection not available'],
        recommendations: []
      };
    }

    try {
      const features = await this.extractTransactionFeatures(transactionData);
      const prediction = await this.model.predict(tf.tensor2d([features])) as tf.Tensor;
      const fraudProbability = await prediction.data();
      
      prediction.dispose();
      
      const riskScore = fraudProbability[0];
      const isFraud = riskScore > this.config.confidenceThreshold;
      const confidence = Math.abs(riskScore - 0.5) * 2; // Distance from uncertain (0.5)
      
      const reasons = await this.analyzeFraudReasons(transactionData, features);
      const recommendations = this.generateRecommendations(riskScore, reasons);

      return {
        transactionId: transactionData.name || 'current',
        isFraud,
        confidence,
        riskScore,
        reasons,
        recommendations
      };
    } catch (error) {
      console.error('Error analyzing transaction for fraud:', error);
      return {
        transactionId: transactionData.name || 'unknown',
        isFraud: false,
        confidence: 0,
        riskScore: 0,
        reasons: ['Analysis error'],
        recommendations: ['Manual review recommended']
      };
    }
  }

  private async analyzeFraudReasons(transaction: any, features: number[]): Promise<string[]> {
    const reasons: string[] = [];
    const amount = Number(transaction.grandTotal) || 0;
    const date = new Date(transaction.date || new Date());
    const hour = date.getHours();
    
    // Analyze specific risk factors
    if (amount > 5000) {
      reasons.push('High transaction amount');
    }
    
    if (features[5] === 1) { // isRoundNumber
      reasons.push('Transaction amount is round number');
    }
    
    if (features[6] === 1) { // isUnusualHour
      reasons.push('Transaction occurred outside business hours');
    }
    
    if (features[8] === 1 && amount > 2000) { // isCashOnly and high value
      reasons.push('High-value cash-only transaction');
    }
    
    if (features[9] === 1) { // hasMultiplePayments
      reasons.push('Multiple payment methods used');
    }
    
    // Check for rapid successive transactions
    const recentTransactions = await this.getRecentTransactions(transaction.party, 10);
    if (recentTransactions.length > 5) {
      reasons.push('Multiple transactions in short time period');
    }
    
    // Check for unusual quantity patterns
    if (features[2] > 2) { // High normalized quantity
      reasons.push('Unusually high quantity of items');
    }
    
    return reasons;
  }

  private async getRecentTransactions(customerId: string, minutes: number): Promise<any[]> {
    try {
      const cutoffTime = new Date(Date.now() - minutes * 60 * 1000);
      
      return await this.fyo.db.getAllRaw(ModelNameEnum.SalesInvoice, {
        filters: {
          party: customerId,
          date: ['>=', cutoffTime]
        }
      });
    } catch (error) {
      return [];
    }
  }

  private generateRecommendations(riskScore: number, reasons: string[]): string[] {
    const recommendations: string[] = [];
    
    if (riskScore > 0.8) {
      recommendations.push('Block transaction and require manager approval');
      recommendations.push('Verify customer identity');
      recommendations.push('Document transaction details thoroughly');
    } else if (riskScore > 0.6) {
      recommendations.push('Request additional customer verification');
      recommendations.push('Monitor customer for future transactions');
      recommendations.push('Consider limiting transaction amount');
    } else if (riskScore > 0.4) {
      recommendations.push('Proceed with caution');
      recommendations.push('Keep detailed transaction records');
    } else {
      recommendations.push('Transaction appears legitimate');
      recommendations.push('Process normally');
    }
    
    // Specific recommendations based on reasons
    if (reasons.includes('High transaction amount')) {
      recommendations.push('Verify customer purchasing authority');
    }
    
    if (reasons.includes('Transaction occurred outside business hours')) {
      recommendations.push('Confirm legitimate business need for after-hours transaction');
    }
    
    if (reasons.includes('High-value cash-only transaction')) {
      recommendations.push('Verify cash source and count carefully');
      recommendations.push('Consider currency transaction reporting requirements');
    }
    
    return recommendations;
  }

  async getFraudPatterns(): Promise<FraudPattern[]> {
    try {
      // Analyze historical data for fraud patterns
      const transactions = await this.fyo.db.getAllRaw(ModelNameEnum.SalesInvoice, {
        orderBy: 'date DESC',
        limit: 5000
      });

      const patterns: FraudPattern[] = [];
      
      // Pattern: Round number transactions
      const roundNumberCount = transactions.filter(t => Number(t.grandTotal) % 10 === 0).length;
      if (roundNumberCount > transactions.length * 0.3) {
        patterns.push({
          patternType: 'round_numbers',
          description: 'High frequency of round number transactions',
          frequency: roundNumberCount,
          severity: 'medium',
          examples: ['$100.00', '$500.00', '$1000.00']
        });
      }
      
      // Pattern: Unusual hour transactions
      const unusualHourCount = transactions.filter(t => {
        const hour = new Date(t.date).getHours();
        return hour < 8 || hour > 22;
      }).length;
      
      if (unusualHourCount > 0) {
        patterns.push({
          patternType: 'unusual_hours',
          description: 'Transactions occurring outside business hours',
          frequency: unusualHourCount,
          severity: unusualHourCount > 50 ? 'high' : 'low',
          examples: ['2:30 AM transaction', '11:45 PM transaction']
        });
      }
      
      // Pattern: High-value transactions
      const highValueCount = transactions.filter(t => Number(t.grandTotal) > 5000).length;
      if (highValueCount > 0) {
        patterns.push({
          patternType: 'high_value',
          description: 'High-value transactions requiring attention',
          frequency: highValueCount,
          severity: highValueCount > 100 ? 'high' : 'medium',
          examples: ['$7,500 purchase', '$12,000 bulk order']
        });
      }
      
      return patterns;
    } catch (error) {
      console.error('Error analyzing fraud patterns:', error);
      return [];
    }
  }

  async getRealTimeFraudAlerts(): Promise<FraudAnalysis[]> {
    try {
      // Get recent transactions (last hour)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentTransactions = await this.fyo.db.getAllRaw(ModelNameEnum.SalesInvoice, {
        filters: {
          date: ['>=', oneHourAgo]
        },
        orderBy: 'date DESC'
      });

      const alerts: FraudAnalysis[] = [];
      
      for (const transaction of recentTransactions) {
        const analysis = await this.analyzeTransaction(transaction);
        
        if (analysis.riskScore > 0.5) { // Only include suspicious transactions
          alerts.push(analysis);
        }
      }
      
      return alerts.sort((a, b) => b.riskScore - a.riskScore);
    } catch (error) {
      console.error('Error getting real-time fraud alerts:', error);
      return [];
    }
  }

  async updateModel(): Promise<void> {
    console.log('Updating fraud detection model...');
    await this.trainModel();
  }

  async shutdown(): Promise<void> {
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
    this.isModelLoaded = false;
    this.suspiciousPatterns.clear();
  }
}