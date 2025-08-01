import { InventoryForecaster } from './services/InventoryForecaster';
import { CustomerAnalytics } from './services/CustomerAnalytics';
import { FraudDetector } from './services/FraudDetector';
import { DynamicPricing } from './services/DynamicPricing';
import { SalesPredictor } from './services/SalesPredictor';
import { ChatAssistant } from './services/ChatAssistant';
import { Fyo } from 'fyo';

export interface AIConfig {
  enabled: boolean;
  modelUpdateInterval: number;
  confidenceThreshold: number;
  enableOfflineMode: boolean;
}

export class AIService {
  private fyo: Fyo;
  private config: AIConfig;
  
  public inventoryForecaster: InventoryForecaster;
  public customerAnalytics: CustomerAnalytics;
  public fraudDetector: FraudDetector;
  public dynamicPricing: DynamicPricing;
  public salesPredictor: SalesPredictor;
  public chatAssistant: ChatAssistant;

  constructor(fyo: Fyo, config: AIConfig) {
    this.fyo = fyo;
    this.config = config;
    
    // Initialize AI services
    this.inventoryForecaster = new InventoryForecaster(fyo, config);
    this.customerAnalytics = new CustomerAnalytics(fyo, config);
    this.fraudDetector = new FraudDetector(fyo, config);
    this.dynamicPricing = new DynamicPricing(fyo, config);
    this.salesPredictor = new SalesPredictor(fyo, config);
    this.chatAssistant = new ChatAssistant(fyo, config);
  }

  async initialize(): Promise<void> {
    if (!this.config.enabled) {
      console.log('AI services disabled in configuration');
      return;
    }

    console.log('Initializing UniPOS AI services...');
    
    try {
      await Promise.all([
        this.inventoryForecaster.initialize(),
        this.customerAnalytics.initialize(),
        this.fraudDetector.initialize(),
        this.dynamicPricing.initialize(),
        this.salesPredictor.initialize(),
        this.chatAssistant.initialize()
      ]);
      
      console.log('AI services initialized successfully');
      
      // Start periodic model updates
      this.startPeriodicUpdates();
    } catch (error) {
      console.error('Failed to initialize AI services:', error);
      throw error;
    }
  }

  private startPeriodicUpdates(): void {
    setInterval(async () => {
      try {
        await this.updateModels();
      } catch (error) {
        console.error('Error during periodic model update:', error);
      }
    }, this.config.modelUpdateInterval);
  }

  async updateModels(): Promise<void> {
    console.log('Updating AI models...');
    
    await Promise.all([
      this.inventoryForecaster.updateModel(),
      this.customerAnalytics.updateModel(),
      this.salesPredictor.updateModel()
    ]);
    
    console.log('AI models updated successfully');
  }

  async shutdown(): Promise<void> {
    console.log('Shutting down AI services...');
    
    await Promise.all([
      this.inventoryForecaster.shutdown(),
      this.customerAnalytics.shutdown(),
      this.fraudDetector.shutdown(),
      this.dynamicPricing.shutdown(),
      this.salesPredictor.shutdown()
    ]);
  }

  // Quick access methods for common AI operations
  async getForecastedDemand(itemCode: string, days: number = 30): Promise<number> {
    return this.inventoryForecaster.predictDemand(itemCode, days);
  }

  async getCustomerLTV(customerId: string): Promise<number> {
    return this.customerAnalytics.calculateLifetimeValue(customerId);
  }

  async checkTransactionFraud(transactionData: any): Promise<{ isFraud: boolean; confidence: number }> {
    return this.fraudDetector.analyzeTransaction(transactionData);
  }

  async getOptimalPrice(itemCode: string, currentDemand: number): Promise<number> {
    return this.dynamicPricing.calculateOptimalPrice(itemCode, currentDemand);
  }

  async getSalesForcast(days: number = 7): Promise<Array<{ date: string; predicted_sales: number }>> {
    return this.salesPredictor.predictSales(days);
  }
}

export default AIService;