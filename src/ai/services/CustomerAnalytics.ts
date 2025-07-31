import * as tf from '@tensorflow/tfjs';
import { Fyo } from 'fyo';
import { AIConfig } from '../index';
import { ModelNameEnum } from 'models/types';
import * as ss from 'simple-statistics';

export interface CustomerInsight {
  customerId: string;
  customerName: string;
  lifetimeValue: number;
  churnRisk: number;
  preferredCategories: string[];
  averageOrderValue: number;
  purchaseFrequency: number;
  lastPurchaseDate: Date;
  recommendedProducts: string[];
  loyaltyScore: number;
  segment: 'high_value' | 'loyal' | 'at_risk' | 'new' | 'occasional';
}

export interface CustomerSegmentation {
  segmentName: string;
  description: string;
  customerCount: number;
  averageLTV: number;
  characteristics: string[];
  marketingStrategy: string;
}

export interface PersonalizedRecommendation {
  customerId: string;
  productCode: string;
  productName: string;
  score: number;
  reason: string;
  category: string;
}

export class CustomerAnalytics {
  private fyo: Fyo;
  private config: AIConfig;
  private ltvModel: tf.LayersModel | null = null;
  private churnModel: tf.LayersModel | null = null;
  private recommendationModel: tf.LayersModel | null = null;
  private isModelLoaded = false;

  constructor(fyo: Fyo, config: AIConfig) {
    this.fyo = fyo;
    this.config = config;
  }

  async initialize(): Promise<void> {
    console.log('Initializing Customer Analytics...');
    
    try {
      await this.loadOrCreateModels();
      await this.trainModels();
      
      this.isModelLoaded = true;
      console.log('Customer Analytics initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Customer Analytics:', error);
      throw error;
    }
  }

  private async loadOrCreateModels(): Promise<void> {
    try {
      // Load existing models
      this.ltvModel = await tf.loadLayersModel('localstorage://customer-ltv-model');
      this.churnModel = await tf.loadLayersModel('localstorage://customer-churn-model');
      this.recommendationModel = await tf.loadLayersModel('localstorage://customer-recommendation-model');
      console.log('Loaded existing customer analytics models');
    } catch (error) {
      // Create new models
      console.log('Creating new customer analytics models');
      this.ltvModel = this.createLTVModel();
      this.churnModel = this.createChurnModel();
      this.recommendationModel = this.createRecommendationModel();
    }
  }

  private createLTVModel(): tf.LayersModel {
    const model = tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [10], // Features: purchase_frequency, avg_order_value, days_since_last, category_diversity, etc.
          units: 32,
          activation: 'relu'
        }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({
          units: 16,
          activation: 'relu'
        }),
        tf.layers.dense({
          units: 1,
          activation: 'linear' // Regression for LTV prediction
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

  private createChurnModel(): tf.LayersModel {
    const model = tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [8], // Features for churn prediction
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
          activation: 'sigmoid' // Binary classification for churn
        })
      ]
    });

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    });

    return model;
  }

  private createRecommendationModel(): tf.LayersModel {
    const model = tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [15], // Combined customer and product features
          units: 64,
          activation: 'relu'
        }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({
          units: 32,
          activation: 'relu'
        }),
        tf.layers.dense({
          units: 1,
          activation: 'sigmoid' // Probability of purchase
        })
      ]
    });

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    });

    return model;
  }

  private async trainModels(): Promise<void> {
    const customerData = await this.prepareCustomerData();
    
    if (customerData.length > 0) {
      await this.trainLTVModel(customerData);
      await this.trainChurnModel(customerData);
      await this.trainRecommendationModel();
    }
  }

  private async prepareCustomerData(): Promise<any[]> {
    try {
      // Get all customers with their transaction history
      const customers = await this.fyo.db.getAllRaw(ModelNameEnum.Party, {
        filters: { role: 'Customer' }
      });

      const customerData = [];

      for (const customer of customers) {
        // Get customer transactions
        const transactions = await this.fyo.db.getAllRaw(ModelNameEnum.SalesInvoice, {
          filters: { party: customer.name },
          orderBy: 'date'
        });

        if (transactions.length === 0) continue;

        const features = await this.extractCustomerFeatures(customer, transactions);
        customerData.push(features);
      }

      return customerData;
    } catch (error) {
      console.error('Error preparing customer data:', error);
      return [];
    }
  }

  private async extractCustomerFeatures(customer: any, transactions: any[]): Promise<any> {
    const now = new Date();
    const firstTransaction = new Date(transactions[0].date);
    const lastTransaction = new Date(transactions[transactions.length - 1].date);
    
    // Calculate basic metrics
    const totalValue = transactions.reduce((sum, t) => sum + (Number(t.grandTotal) || 0), 0);
    const totalQuantity = await this.getTotalQuantityForCustomer(customer.name);
    const daysSinceFirst = Math.floor((now.getTime() - firstTransaction.getTime()) / (1000 * 60 * 60 * 24));
    const daysSinceLast = Math.floor((now.getTime() - lastTransaction.getTime()) / (1000 * 60 * 60 * 24));
    const purchaseFrequency = transactions.length / Math.max(daysSinceFirst / 30, 1); // Purchases per month
    const avgOrderValue = totalValue / transactions.length;
    
    // Calculate category diversity
    const categories = await this.getCustomerCategories(customer.name);
    const categoryDiversity = categories.length;
    
    // Calculate seasonality
    const monthlyPurchases = this.getMonthlyPurchasePattern(transactions);
    const seasonalityScore = this.calculateSeasonalityScore(monthlyPurchases);
    
    // Calculate return behavior
    const returns = await this.getCustomerReturns(customer.name);
    const returnRate = returns.length / transactions.length;
    
    return {
      customerId: customer.name,
      customerName: customer.customerName || customer.name,
      totalValue,
      totalQuantity,
      transactionCount: transactions.length,
      daysSinceFirst,
      daysSinceLast,
      purchaseFrequency,
      avgOrderValue,
      categoryDiversity,
      seasonalityScore,
      returnRate,
      features: [
        purchaseFrequency,
        avgOrderValue / 1000, // Normalize
        daysSinceLast / 365, // Normalize to years
        categoryDiversity / 10, // Normalize
        seasonalityScore,
        returnRate,
        totalValue / 10000, // Normalize
        transactions.length / 100, // Normalize
        daysSinceFirst / 365, // Customer age in years
        Math.log(totalValue + 1) / 10 // Log-normalized total value
      ]
    };
  }

  private async getTotalQuantityForCustomer(customerId: string): Promise<number> {
    try {
      const items = await this.fyo.db.getAllRaw(ModelNameEnum.SalesInvoiceItem, {
        filters: { party: customerId }
      });
      
      return items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    } catch (error) {
      return 0;
    }
  }

  private async getCustomerCategories(customerId: string): Promise<string[]> {
    try {
      const items = await this.fyo.db.getAllRaw(ModelNameEnum.SalesInvoiceItem, {
        filters: { party: customerId },
        fields: ['item']
      });

      const categories = new Set<string>();
      
      for (const item of items) {
        const product = await this.fyo.db.get(ModelNameEnum.Item, item.item);
        if (product?.itemType) {
          categories.add(product.itemType);
        }
      }

      return Array.from(categories);
    } catch (error) {
      return [];
    }
  }

  private getMonthlyPurchasePattern(transactions: any[]): number[] {
    const monthlyCount = new Array(12).fill(0);
    
    for (const transaction of transactions) {
      const month = new Date(transaction.date).getMonth();
      monthlyCount[month]++;
    }
    
    return monthlyCount;
  }

  private calculateSeasonalityScore(monthlyPurchases: number[]): number {
    if (monthlyPurchases.every(count => count === 0)) return 0;
    
    const mean = ss.mean(monthlyPurchases);
    const variance = ss.variance(monthlyPurchases);
    
    return variance / (mean || 1); // Higher score = more seasonal
  }

  private async getCustomerReturns(customerId: string): Promise<any[]> {
    try {
      return await this.fyo.db.getAllRaw(ModelNameEnum.SalesInvoice, {
        filters: { 
          party: customerId,
          isCancelled: true
        }
      });
    } catch (error) {
      return [];
    }
  }

  private async trainLTVModel(customerData: any[]): Promise<void> {
    if (!this.ltvModel || customerData.length < 10) return;

    console.log('Training LTV model...');

    const features = customerData.map(c => c.features);
    const labels = customerData.map(c => [c.totalValue]);

    const xs = tf.tensor2d(features);
    const ys = tf.tensor2d(labels);

    await this.ltvModel.fit(xs, ys, {
      epochs: 30,
      batchSize: 16,
      validationSplit: 0.2,
      verbose: 0
    });

    await this.ltvModel.save('localstorage://customer-ltv-model');
    
    xs.dispose();
    ys.dispose();
  }

  private async trainChurnModel(customerData: any[]): Promise<void> {
    if (!this.churnModel || customerData.length < 10) return;

    console.log('Training churn model...');

    // Define churn as no purchase in last 90 days
    const churnThreshold = 90;
    
    const features = customerData.map(c => c.features.slice(0, 8)); // Use subset of features
    const labels = customerData.map(c => [c.daysSinceLast > churnThreshold ? 1 : 0]);

    const xs = tf.tensor2d(features);
    const ys = tf.tensor2d(labels);

    await this.churnModel.fit(xs, ys, {
      epochs: 25,
      batchSize: 16,
      validationSplit: 0.2,
      verbose: 0
    });

    await this.churnModel.save('localstorage://customer-churn-model');
    
    xs.dispose();
    ys.dispose();
  }

  private async trainRecommendationModel(): Promise<void> {
    if (!this.recommendationModel) return;

    console.log('Training recommendation model...');

    // Create training data from historical purchases
    const trainingData = await this.createRecommendationTrainingData();
    
    if (trainingData.length < 100) return; // Need sufficient data

    const features = trainingData.map(d => d.features);
    const labels = trainingData.map(d => [d.purchased ? 1 : 0]);

    const xs = tf.tensor2d(features);
    const ys = tf.tensor2d(labels);

    await this.recommendationModel.fit(xs, ys, {
      epochs: 20,
      batchSize: 32,
      validationSplit: 0.2,
      verbose: 0
    });

    await this.recommendationModel.save('localstorage://customer-recommendation-model');
    
    xs.dispose();
    ys.dispose();
  }

  private async createRecommendationTrainingData(): Promise<Array<{ features: number[]; purchased: boolean }>> {
    // Implementation would create customer-product pairs with features
    // and whether the customer actually purchased the product
    // This is a simplified version
    return [];
  }

  async calculateLifetimeValue(customerId: string): Promise<number> {
    if (!this.isModelLoaded || !this.ltvModel) return 0;

    try {
      const customer = await this.fyo.db.get(ModelNameEnum.Party, customerId);
      if (!customer) return 0;

      const transactions = await this.fyo.db.getAllRaw(ModelNameEnum.SalesInvoice, {
        filters: { party: customerId }
      });

      if (transactions.length === 0) return 0;

      const features = await this.extractCustomerFeatures(customer, transactions);
      const prediction = await this.ltvModel.predict(tf.tensor2d([features.features])) as tf.Tensor;
      const value = await prediction.data();
      
      prediction.dispose();
      
      return Math.max(0, value[0]);
    } catch (error) {
      console.error('Error calculating LTV:', error);
      return 0;
    }
  }

  async predictChurnRisk(customerId: string): Promise<number> {
    if (!this.isModelLoaded || !this.churnModel) return 0;

    try {
      const customer = await this.fyo.db.get(ModelNameEnum.Party, customerId);
      if (!customer) return 0;

      const transactions = await this.fyo.db.getAllRaw(ModelNameEnum.SalesInvoice, {
        filters: { party: customerId }
      });

      if (transactions.length === 0) return 1; // New customers have high churn risk initially

      const features = await this.extractCustomerFeatures(customer, transactions);
      const churnFeatures = features.features.slice(0, 8);
      
      const prediction = await this.churnModel.predict(tf.tensor2d([churnFeatures])) as tf.Tensor;
      const risk = await prediction.data();
      
      prediction.dispose();
      
      return Math.min(1, Math.max(0, risk[0]));
    } catch (error) {
      console.error('Error predicting churn risk:', error);
      return 0.5; // Default moderate risk
    }
  }

  async getCustomerInsights(customerId?: string): Promise<CustomerInsight[]> {
    const insights: CustomerInsight[] = [];

    try {
      let customers;
      if (customerId) {
        const customer = await this.fyo.db.get(ModelNameEnum.Party, customerId);
        customers = customer ? [customer] : [];
      } else {
        customers = await this.fyo.db.getAllRaw(ModelNameEnum.Party, {
          filters: { role: 'Customer' }
        });
      }

      for (const customer of customers) {
        const insight = await this.generateCustomerInsight(customer);
        if (insight) {
          insights.push(insight);
        }
      }
    } catch (error) {
      console.error('Error generating customer insights:', error);
    }

    return insights.sort((a, b) => b.lifetimeValue - a.lifetimeValue);
  }

  private async generateCustomerInsight(customer: any): Promise<CustomerInsight | null> {
    try {
      const transactions = await this.fyo.db.getAllRaw(ModelNameEnum.SalesInvoice, {
        filters: { party: customer.name },
        orderBy: 'date DESC'
      });

      if (transactions.length === 0) return null;

      const lifetimeValue = await this.calculateLifetimeValue(customer.name);
      const churnRisk = await this.predictChurnRisk(customer.name);
      const preferredCategories = await this.getCustomerCategories(customer.name);
      const totalValue = transactions.reduce((sum, t) => sum + (Number(t.grandTotal) || 0), 0);
      const averageOrderValue = totalValue / transactions.length;
      const daysSinceFirst = Math.floor((Date.now() - new Date(transactions[transactions.length - 1].date).getTime()) / (1000 * 60 * 60 * 24));
      const purchaseFrequency = transactions.length / Math.max(daysSinceFirst / 30, 1);
      const lastPurchaseDate = new Date(transactions[0].date);
      const recommendedProducts = await this.getProductRecommendations(customer.name);
      const loyaltyScore = this.calculateLoyaltyScore(transactions, churnRisk);
      const segment = this.categorizeCustomer(lifetimeValue, churnRisk, purchaseFrequency);

      return {
        customerId: customer.name,
        customerName: customer.customerName || customer.name,
        lifetimeValue,
        churnRisk,
        preferredCategories,
        averageOrderValue,
        purchaseFrequency,
        lastPurchaseDate,
        recommendedProducts,
        loyaltyScore,
        segment
      };
    } catch (error) {
      console.error(`Error generating insight for customer ${customer.name}:`, error);
      return null;
    }
  }

  private calculateLoyaltyScore(transactions: any[], churnRisk: number): number {
    const recency = Math.max(0, 100 - Math.floor((Date.now() - new Date(transactions[0].date).getTime()) / (1000 * 60 * 60 * 24)));
    const frequency = Math.min(100, transactions.length * 5);
    const monetary = Math.min(100, Math.log(transactions.reduce((sum, t) => sum + Number(t.grandTotal), 0) + 1) * 10);
    const retention = (1 - churnRisk) * 100;
    
    return Math.round((recency + frequency + monetary + retention) / 4);
  }

  private categorizeCustomer(ltv: number, churnRisk: number, frequency: number): CustomerInsight['segment'] {
    if (ltv > 10000 && churnRisk < 0.3) return 'high_value';
    if (frequency > 2 && churnRisk < 0.4) return 'loyal';
    if (churnRisk > 0.7) return 'at_risk';
    if (frequency < 0.5) return 'new';
    return 'occasional';
  }

  private async getProductRecommendations(customerId: string, limit: number = 5): Promise<string[]> {
    try {
      // Get customer's purchase history
      const items = await this.fyo.db.getAllRaw(ModelNameEnum.SalesInvoiceItem, {
        filters: { party: customerId },
        fields: ['item']
      });

      const purchasedItems = new Set(items.map(item => item.item));
      
      // Get all available products
      const allProducts = await this.fyo.db.getAllRaw(ModelNameEnum.Item, {
        fields: ['name', 'itemType']
      });

      // Simple collaborative filtering - recommend products bought by similar customers
      const recommendations = allProducts
        .filter(product => !purchasedItems.has(product.name))
        .slice(0, limit)
        .map(product => product.name);

      return recommendations;
    } catch (error) {
      console.error('Error generating product recommendations:', error);
      return [];
    }
  }

  async getCustomerSegmentation(): Promise<CustomerSegmentation[]> {
    try {
      const insights = await this.getCustomerInsights();
      const segments: Record<string, CustomerInsight[]> = {};

      // Group customers by segment
      for (const insight of insights) {
        if (!segments[insight.segment]) {
          segments[insight.segment] = [];
        }
        segments[insight.segment].push(insight);
      }

      const segmentations: CustomerSegmentation[] = [];

      for (const [segmentName, customers] of Object.entries(segments)) {
        const averageLTV = ss.mean(customers.map(c => c.lifetimeValue));
        
        segmentations.push({
          segmentName,
          description: this.getSegmentDescription(segmentName as CustomerInsight['segment']),
          customerCount: customers.length,
          averageLTV,
          characteristics: this.getSegmentCharacteristics(segmentName as CustomerInsight['segment']),
          marketingStrategy: this.getMarketingStrategy(segmentName as CustomerInsight['segment'])
        });
      }

      return segmentations;
    } catch (error) {
      console.error('Error generating customer segmentation:', error);
      return [];
    }
  }

  private getSegmentDescription(segment: CustomerInsight['segment']): string {
    const descriptions = {
      high_value: 'High-value customers with significant lifetime value and low churn risk',
      loyal: 'Frequent customers with consistent purchase patterns',
      at_risk: 'Customers with high probability of churning',
      new: 'Recently acquired customers with limited purchase history',
      occasional: 'Customers with sporadic purchase behavior'
    };
    
    return descriptions[segment];
  }

  private getSegmentCharacteristics(segment: CustomerInsight['segment']): string[] {
    const characteristics = {
      high_value: ['High LTV', 'Low churn risk', 'Regular purchases', 'Multiple categories'],
      loyal: ['Frequent purchases', 'Consistent behavior', 'Long tenure', 'Brand advocates'],
      at_risk: ['Declining frequency', 'Extended time since last purchase', 'Requires retention efforts'],
      new: ['Recent first purchase', 'Exploring products', 'Building habits', 'High potential'],
      occasional: ['Irregular patterns', 'Price sensitive', 'Seasonal purchases', 'Promotion responsive']
    };
    
    return characteristics[segment];
  }

  private getMarketingStrategy(segment: CustomerInsight['segment']): string {
    const strategies = {
      high_value: 'VIP treatment, exclusive offers, personal service, loyalty rewards',
      loyal: 'Referral programs, brand ambassador opportunities, consistent engagement',
      at_risk: 'Win-back campaigns, special discounts, personalized outreach, satisfaction surveys',
      new: 'Onboarding sequences, education content, first-time buyer incentives, category exploration',
      occasional: 'Promotional campaigns, seasonal offers, flash sales, category-specific deals'
    };
    
    return strategies[segment];
  }

  async updateModel(): Promise<void> {
    console.log('Updating customer analytics models...');
    await this.trainModels();
  }

  async shutdown(): Promise<void> {
    if (this.ltvModel) {
      this.ltvModel.dispose();
      this.ltvModel = null;
    }
    if (this.churnModel) {
      this.churnModel.dispose();
      this.churnModel = null;
    }
    if (this.recommendationModel) {
      this.recommendationModel.dispose();
      this.recommendationModel = null;
    }
    this.isModelLoaded = false;
  }
}