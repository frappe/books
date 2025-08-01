import { Fyo } from 'fyo';
import { AIConfig } from '../index';
import { ModelNameEnum } from 'models/types';

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  context?: ChatContext;
  actions?: ChatAction[];
}

export interface ChatContext {
  intent: string;
  entities: Record<string, any>;
  stage: string;
  sessionData: Record<string, any>;
}

export interface ChatAction {
  type: 'confirm' | 'edit' | 'execute' | 'suggest';
  label: string;
  data: any;
  callback: string;
}

export interface ConversationSession {
  sessionId: string;
  messages: ChatMessage[];
  currentContext: ChatContext | null;
  startTime: Date;
  lastActivity: Date;
}

export class ChatAssistant {
  private fyo: Fyo;
  private config: AIConfig;
  private sessions: Map<string, ConversationSession> = new Map();
  private intentPatterns: Map<string, RegExp[]> = new Map();
  private isInitialized = false;

  constructor(fyo: Fyo, config: AIConfig) {
    this.fyo = fyo;
    this.config = config;
    this.initializeIntentPatterns();
  }

  async initialize(): Promise<void> {
    console.log('Initializing Chat Assistant...');
    
    try {
      this.setupIntentRecognition();
      this.isInitialized = true;
      console.log('Chat Assistant initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Chat Assistant:', error);
      throw error;
    }
  }

  private initializeIntentPatterns(): void {
    // Product Management Intents
    this.intentPatterns.set('add_product', [
      /add\s+(?:new\s+)?product\s+(?:named\s+)?['"](.*?)['"](?:.*?category\s+['"](.*?)['"])?(?:.*?price\s+\$?(\d+\.?\d*))?(?:.*?stock\s+(\d+))?/i,
      /create\s+(?:new\s+)?item\s+['"](.*?)['"](?:.*?\$?(\d+\.?\d*))?(?:.*?(\d+)\s+units?)?/i,
      /new\s+product:\s*(.*?)(?:,\s*\$?(\d+\.?\d*))?(?:,\s*stock\s+(\d+))?/i
    ]);

    // Sales Intents
    this.intentPatterns.set('create_sale', [
      /(?:create\s+)?(?:new\s+)?sale\s+for\s+(.*?)(?:,\s*(\d+)\s+(.*?))?/i,
      /sell\s+(\d+)\s+(.*?)(?:\s+to\s+(.*?))?(?:,\s*(cash|credit|card|mobile))?/i,
      /ring\s+up\s+(.*?)(?:\s+for\s+(.*?))?/i
    ]);

    // Inventory Intents
    this.intentPatterns.set('update_inventory', [
      /(?:increase|add|update)\s+(.*?)\s+stock\s+by\s+(\d+)/i,
      /(?:decrease|reduce)\s+(.*?)\s+stock\s+by\s+(\d+)/i,
      /set\s+(.*?)\s+stock\s+to\s+(\d+)/i,
      /restock\s+(.*?)(?:\s+with\s+(\d+))?/i
    ]);

    // Reporting Intents
    this.intentPatterns.set('view_report', [
      /show\s+(?:today'?s|daily)\s+sales(?:\s+(?:summary|report))?/i,
      /(?:get|show|display)\s+sales\s+report/i,
      /how\s+much\s+(?:did\s+we\s+)?(?:sell|make)\s+today/i,
      /what\s+are\s+(?:today'?s|our)\s+sales/i
    ]);

    // Customer Intents
    this.intentPatterns.set('manage_customer', [
      /add\s+(?:new\s+)?customer\s+(.*?)(?:\s+(?:email|phone)\s+(.*?))?/i,
      /create\s+customer\s+(?:account\s+for\s+)?(.*?)/i,
      /new\s+customer:\s*(.*?)/i
    ]);

    // Search Intents
    this.intentPatterns.set('search_product', [
      /(?:find|search|look\s+for)\s+(?:product\s+)?(.*?)/i,
      /do\s+we\s+have\s+(.*?)/i,
      /check\s+(?:stock\s+(?:for\s+)?)?(?:product\s+)?(.*?)/i
    ]);

    // Help Intents
    this.intentPatterns.set('help', [
      /help/i,
      /what\s+can\s+(?:you|i)\s+do/i,
      /how\s+(?:do\s+i|to)\s+(.*?)/i,
      /commands?/i
    ]);
  }

  private setupIntentRecognition(): void {
    // This could be enhanced with a proper NLP library like compromise.js or natural
    // For now, we'll use regex patterns with entity extraction
  }

  async processMessage(message: string, sessionId: string = 'default'): Promise<ChatMessage> {
    if (!this.isInitialized) {
      throw new Error('Chat Assistant not initialized');
    }

    const session = this.getOrCreateSession(sessionId);
    const userMessage: ChatMessage = {
      id: this.generateMessageId(),
      type: 'user',
      content: message,
      timestamp: new Date()
    };

    session.messages.push(userMessage);
    session.lastActivity = new Date();

    try {
      const intent = this.recognizeIntent(message);
      const entities = this.extractEntities(message, intent);
      
      const context: ChatContext = {
        intent,
        entities,
        stage: session.currentContext?.stage || 'initial',
        sessionData: session.currentContext?.sessionData || {}
      };

      const response = await this.generateResponse(context, session);
      
      session.messages.push(response);
      session.currentContext = context;

      return response;
    } catch (error) {
      console.error('Error processing message:', error);
      return this.createErrorResponse();
    }
  }

  private getOrCreateSession(sessionId: string): ConversationSession {
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, {
        sessionId,
        messages: [],
        currentContext: null,
        startTime: new Date(),
        lastActivity: new Date()
      });
    }
    return this.sessions.get(sessionId)!;
  }

  private recognizeIntent(message: string): string {
    const normalizedMessage = message.toLowerCase().trim();
    
    for (const [intent, patterns] of this.intentPatterns.entries()) {
      for (const pattern of patterns) {
        if (pattern.test(normalizedMessage)) {
          return intent;
        }
      }
    }
    
    return 'unknown';
  }

  private extractEntities(message: string, intent: string): Record<string, any> {
    const entities: Record<string, any> = {};
    const patterns = this.intentPatterns.get(intent) || [];
    
    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match) {
        switch (intent) {
          case 'add_product':
            entities.productName = match[1]?.trim();
            entities.category = match[2]?.trim();
            entities.price = match[3] ? parseFloat(match[3]) : null;
            entities.stock = match[4] ? parseInt(match[4]) : null;
            break;
            
          case 'create_sale':
            if (match[1] && match[2]) {
              // Pattern: sell X items to customer
              entities.quantity = parseInt(match[1]);
              entities.productName = match[2]?.trim();
              entities.customer = match[3]?.trim();
              entities.paymentMethod = match[4]?.trim();
            } else {
              // Pattern: create sale for customer
              entities.customer = match[1]?.trim();
              entities.quantity = match[2] ? parseInt(match[2]) : null;
              entities.productName = match[3]?.trim();
            }
            break;
            
          case 'update_inventory':
            entities.productName = match[1]?.trim();
            entities.quantity = parseInt(match[2]);
            entities.action = message.toLowerCase().includes('increase') ? 'increase' : 
                           message.toLowerCase().includes('decrease') ? 'decrease' : 'set';
            break;
            
          case 'search_product':
          case 'manage_customer':
            entities.query = match[1]?.trim();
            break;
        }
        break;
      }
    }
    
    return entities;
  }

  private async generateResponse(context: ChatContext, session: ConversationSession): Promise<ChatMessage> {
    switch (context.intent) {
      case 'add_product':
        return await this.handleAddProduct(context);
      case 'create_sale':
        return await this.handleCreateSale(context, session);
      case 'update_inventory':
        return await this.handleUpdateInventory(context);
      case 'view_report':
        return await this.handleViewReport(context);
      case 'search_product':
        return await this.handleSearchProduct(context);
      case 'manage_customer':
        return await this.handleManageCustomer(context);
      case 'help':
        return this.handleHelp();
      default:
        return this.handleUnknownIntent(context);
    }
  }

  private async handleAddProduct(context: ChatContext): Promise<ChatMessage> {
    const { productName, category, price, stock } = context.entities;
    
    if (!productName) {
      return this.createAssistantMessage(
        "I need a product name to add a new product. Try: 'Add product \"Blue T-shirt\"'"
      );
    }

    // Check if we have all required information
    const missingInfo = [];
    if (!price) missingInfo.push('price');
    if (!stock) missingInfo.push('stock quantity');

    if (missingInfo.length > 0) {
      context.stage = 'awaiting_product_details';
      context.sessionData = { productName, category, price, stock };
      
      return this.createAssistantMessage(
        `Product entry started for "${productName}".
        Missing: ${missingInfo.join(' and ')}
        
Please provide the ${missingInfo.join(' and ')}, for example:
"Price $19.99, stock 100"`,
        [
          { type: 'suggest', label: 'Set price $10', data: { price: 10 }, callback: 'set_price' },
          { type: 'suggest', label: 'Set stock 50', data: { stock: 50 }, callback: 'set_stock' }
        ]
      );
    }

    try {
      // Create the product
      await this.createProduct({
        name: productName,
        itemName: productName,
        itemCode: this.generateItemCode(productName),
        rate: price,
        itemType: category || 'Product',
        trackQuantity: 1
      });

      // Add initial stock if provided
      if (stock > 0) {
        await this.updateStock(productName, stock, 'add');
      }

      return this.createAssistantMessage(
        `✅ Product "${productName}" added successfully!
        - Price: $${price}
        - Initial Stock: ${stock || 0} units
        ${category ? `- Category: ${category}` : ''}
        
To add another product, just tell me the details.`,
        [
          { type: 'suggest', label: 'Add another product', data: {}, callback: 'add_product' },
          { type: 'suggest', label: 'View inventory', data: {}, callback: 'view_inventory' }
        ]
      );
    } catch (error) {
      return this.createAssistantMessage(
        `❌ Error adding product: ${error.message}
        Please try again with different details.`
      );
    }
  }

  private async handleCreateSale(context: ChatContext, session: ConversationSession): Promise<ChatMessage> {
    const { customer, productName, quantity, paymentMethod } = context.entities;
    
    if (!customer && !productName) {
      return this.createAssistantMessage(
        "To create a sale, I need a customer name or product. Try:\n" +
        "- 'Create sale for John Doe'\n" +
        "- 'Sell 2 Blue T-shirts'"
      );
    }

    // Store sale data in session
    if (!context.sessionData.saleItems) {
      context.sessionData.saleItems = [];
    }
    if (!context.sessionData.customer && customer) {
      context.sessionData.customer = customer;
    }

    // Add item to sale if specified
    if (productName && quantity) {
      const product = await this.findProduct(productName);
      if (!product) {
        return this.createAssistantMessage(
          `❌ Product "${productName}" not found. 
          Check spelling or add the product first.`
        );
      }

      context.sessionData.saleItems.push({
        item: product.name,
        itemName: product.itemName,
        quantity: quantity || 1,
        rate: product.rate,
        amount: (quantity || 1) * product.rate
      });
    }

    const saleItems = context.sessionData.saleItems || [];
    const customerName = context.sessionData.customer || customer;

    if (saleItems.length === 0) {
      context.stage = 'awaiting_items';
      return this.createAssistantMessage(
        `Sale started for customer: *${customerName}*
        
What items would you like to add? Say something like:
"Add 2 Blue T-shirts" or "1 Red Mug"`,
        [
          { type: 'suggest', label: 'Browse products', data: {}, callback: 'browse_products' }
        ]
      );
    }

    // Calculate totals
    const subtotal = saleItems.reduce((sum: number, item: any) => sum + item.amount, 0);
    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + tax;

    const itemsText = saleItems.map((item: any) => 
      `• ${item.quantity} × ${item.itemName} ($${item.rate} each) = $${item.amount.toFixed(2)}`
    ).join('\n');

    if (!paymentMethod) {
      context.stage = 'awaiting_payment';
      return this.createAssistantMessage(
        `Sale summary for *${customerName}*:
        
${itemsText}

Subtotal: $${subtotal.toFixed(2)}
Tax: $${tax.toFixed(2)}
**Total: $${total.toFixed(2)}**

How would you like to pay?`,
        [
          { type: 'execute', label: 'Cash', data: { paymentMethod: 'cash' }, callback: 'process_payment' },
          { type: 'execute', label: 'Credit Card', data: { paymentMethod: 'credit_card' }, callback: 'process_payment' },
          { type: 'execute', label: 'Mobile Wallet', data: { paymentMethod: 'mobile' }, callback: 'process_payment' }
        ]
      );
    }

    // Process payment
    try {
      const invoice = await this.createInvoice({
        party: customerName,
        items: saleItems,
        total,
        paymentMethod
      });

      // Clear session data
      context.sessionData = {};

      return this.createAssistantMessage(
        `✅ Sale completed successfully!
        
Invoice #${invoice.name} for $${total.toFixed(2)}
Payment: ${paymentMethod}

Would you like to send the invoice?`,
        [
          { type: 'execute', label: 'Send by Email', data: { invoiceId: invoice.name }, callback: 'send_invoice' },
          { type: 'execute', label: 'Print Receipt', data: { invoiceId: invoice.name }, callback: 'print_receipt' },
          { type: 'suggest', label: 'New Sale', data: {}, callback: 'new_sale' }
        ]
      );
    } catch (error) {
      return this.createAssistantMessage(
        `❌ Error processing sale: ${error.message}
        Please try again.`
      );
    }
  }

  private async handleUpdateInventory(context: ChatContext): Promise<ChatMessage> {
    const { productName, quantity, action } = context.entities;
    
    if (!productName || !quantity) {
      return this.createAssistantMessage(
        "I need a product name and quantity. Try:\n" +
        "- 'Increase Blue T-shirt stock by 50'\n" +
        "- 'Set Red Mug stock to 30'"
      );
    }

    try {
      const product = await this.findProduct(productName);
      if (!product) {
        return this.createAssistantMessage(`❌ Product "${productName}" not found.`);
      }

      const currentStock = await this.getCurrentStock(product.name);
      let newStock: number;

      switch (action) {
        case 'increase':
          newStock = currentStock + quantity;
          await this.updateStock(product.name, quantity, 'add');
          break;
        case 'decrease':
          newStock = Math.max(0, currentStock - quantity);
          await this.updateStock(product.name, quantity, 'subtract');
          break;
        case 'set':
          newStock = quantity;
          await this.setStock(product.name, quantity);
          break;
        default:
          throw new Error('Invalid action');
      }

      return this.createAssistantMessage(
        `✅ Inventory updated for "${product.itemName}"
        
Previous stock: ${currentStock} units
New stock: ${newStock} units
Change: ${action === 'increase' ? '+' : action === 'decrease' ? '-' : ''}${quantity} units`,
        [
          { type: 'suggest', label: 'Update another product', data: {}, callback: 'update_inventory' },
          { type: 'suggest', label: 'View all inventory', data: {}, callback: 'view_inventory' }
        ]
      );
    } catch (error) {
      return this.createAssistantMessage(
        `❌ Error updating inventory: ${error.message}`
      );
    }
  }

  private async handleViewReport(context: ChatContext): Promise<ChatMessage> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todaySales = await this.fyo.db.getAllRaw(ModelNameEnum.SalesInvoice, {
        filters: { date: ['>=', today] }
      });

      const totalSales = todaySales.length;
      const totalRevenue = todaySales.reduce((sum, sale) => sum + (Number(sale.grandTotal) || 0), 0);

      // Get top selling products
      const salesItems = await this.fyo.db.getAllRaw(ModelNameEnum.SalesInvoiceItem, {
        filters: { date: ['>=', today] }
      });

      const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
      
      for (const item of salesItems) {
        const key = item.item;
        if (!productSales[key]) {
          productSales[key] = { name: item.item, quantity: 0, revenue: 0 };
        }
        productSales[key].quantity += Number(item.quantity) || 0;
        productSales[key].revenue += Number(item.amount) || 0;
      }

      const topProducts = Object.values(productSales)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 3);

      const topProductsText = topProducts.length > 0 
        ? topProducts.map(p => `• ${p.name}: ${p.quantity} sold ($${p.revenue.toFixed(2)})`).join('\n')
        : 'No sales yet today';

      return this.createAssistantMessage(
        `📊 **Today's Sales Summary**
        
**Transactions:** ${totalSales}
**Total Revenue:** $${totalRevenue.toFixed(2)}

**Top Products:**
${topProductsText}

Average transaction: $${totalSales > 0 ? (totalRevenue / totalSales).toFixed(2) : '0.00'}`,
        [
          { type: 'suggest', label: 'Weekly report', data: { period: 'week' }, callback: 'view_report' },
          { type: 'suggest', label: 'Monthly report', data: { period: 'month' }, callback: 'view_report' },
          { type: 'suggest', label: 'Export data', data: {}, callback: 'export_report' }
        ]
      );
    } catch (error) {
      return this.createAssistantMessage(
        `❌ Error generating report: ${error.message}`
      );
    }
  }

  private async handleSearchProduct(context: ChatContext): Promise<ChatMessage> {
    const { query } = context.entities;
    
    if (!query) {
      return this.createAssistantMessage(
        "What product are you looking for? Try: 'Find Blue T-shirt' or 'Check Red Mug stock'"
      );
    }

    try {
      const products = await this.searchProducts(query);
      
      if (products.length === 0) {
        return this.createAssistantMessage(
          `❌ No products found matching "${query}"
          
Would you like to add a new product with this name?`,
          [
            { type: 'execute', label: 'Add new product', data: { productName: query }, callback: 'add_product' }
          ]
        );
      }

      const productList = await Promise.all(products.slice(0, 5).map(async (product) => {
        const stock = await this.getCurrentStock(product.name);
        return `• **${product.itemName}** - $${product.rate} (${stock} in stock)`;
      }));

      return this.createAssistantMessage(
        `🔍 Found ${products.length} product(s) matching "${query}":

${productList.join('\n')}`,
        products.slice(0, 3).map(product => ({
          type: 'execute' as const,
          label: `Add ${product.itemName} to sale`,
          data: { productName: product.itemName },
          callback: 'add_to_sale'
        }))
      );
    } catch (error) {
      return this.createAssistantMessage(
        `❌ Error searching products: ${error.message}`
      );
    }
  }

  private async handleManageCustomer(context: ChatContext): Promise<ChatMessage> {
    const { query } = context.entities;
    
    if (!query) {
      return this.createAssistantMessage(
        "Please provide customer details. Try: 'Add customer John Doe' or 'New customer: Jane Smith, jane@email.com'"
      );
    }

    try {
      // For now, we'll create a simple customer record
      const customer = await this.createCustomer({
        name: query,
        customerName: query
      });

      return this.createAssistantMessage(
        `✅ Customer "${query}" added successfully!
        
You can now create sales for this customer.`,
        [
          { type: 'execute', label: 'Create sale for this customer', data: { customer: query }, callback: 'create_sale' },
          { type: 'suggest', label: 'Add another customer', data: {}, callback: 'add_customer' }
        ]
      );
    } catch (error) {
      return this.createAssistantMessage(
        `❌ Error managing customer: ${error.message}`
      );
    }
  }

  private handleHelp(): ChatMessage {
    return this.createAssistantMessage(
      `🤖 **UniPOS Chat Assistant Help**

Here's what I can help you with:

**📦 Product Management:**
• "Add product 'Blue T-shirt', category 'Clothing', price $19.99, stock 100"
• "Increase Red Mug stock by 50"
• "Find Blue T-shirt"

**💰 Sales:**
• "Create sale for John Doe"
• "Sell 2 Blue T-shirts to Jane Smith, credit card"
• "Ring up 1 Red Mug"

**👥 Customers:**
• "Add customer John Doe"
• "New customer: Jane Smith, jane@email.com"

**📊 Reports:**
• "Show today's sales"
• "Sales report"
• "How much did we make today?"

**💡 Tips:**
• Use natural language - I understand conversational commands
• I'll ask for missing information if needed
• Say 'help' anytime for this menu

What would you like to do?`,
      [
        { type: 'suggest', label: 'Add a product', data: {}, callback: 'add_product' },
        { type: 'suggest', label: 'Create a sale', data: {}, callback: 'create_sale' },
        { type: 'suggest', label: 'View sales report', data: {}, callback: 'view_report' }
      ]
    );
  }

  private handleUnknownIntent(context: ChatContext): ChatMessage {
    return this.createAssistantMessage(
      `I'm not sure what you want to do. Here are some things you can try:

• "Add product [name]" - Add new inventory
• "Sell [quantity] [product] to [customer]" - Create sale  
• "Show today's sales" - View reports
• "Find [product]" - Search inventory
• "Help" - See all commands

What would you like to do?`,
      [
        { type: 'suggest', label: 'Show help', data: {}, callback: 'help' },
        { type: 'suggest', label: 'Add product', data: {}, callback: 'add_product' },
        { type: 'suggest', label: 'Create sale', data: {}, callback: 'create_sale' }
      ]
    );
  }

  private createAssistantMessage(content: string, actions: ChatAction[] = []): ChatMessage {
    return {
      id: this.generateMessageId(),
      type: 'assistant',
      content,
      timestamp: new Date(),
      actions
    };
  }

  private createErrorResponse(): ChatMessage {
    return this.createAssistantMessage(
      "Sorry, I encountered an error processing your request. Please try again or type 'help' for assistance."
    );
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Helper methods for database operations
  private async createProduct(productData: any): Promise<any> {
    const doc = this.fyo.doc.getNewDoc(ModelNameEnum.Item, productData);
    await doc.sync();
    return doc;
  }

  private async createInvoice(invoiceData: any): Promise<any> {
    const doc = this.fyo.doc.getNewDoc(ModelNameEnum.SalesInvoice, {
      party: invoiceData.party,
      date: new Date(),
      items: invoiceData.items
    });
    await doc.sync();
    return doc;
  }

  private async createCustomer(customerData: any): Promise<any> {
    const doc = this.fyo.doc.getNewDoc(ModelNameEnum.Party, {
      ...customerData,
      role: 'Customer'
    });
    await doc.sync();
    return doc;
  }

  private async findProduct(query: string): Promise<any> {
    const products = await this.searchProducts(query);
    return products.find(p => 
      p.itemName.toLowerCase() === query.toLowerCase() || 
      p.name.toLowerCase() === query.toLowerCase()
    );
  }

  private async searchProducts(query: string): Promise<any[]> {
    const allProducts = await this.fyo.db.getAllRaw(ModelNameEnum.Item);
    return allProducts.filter(product => 
      product.itemName?.toLowerCase().includes(query.toLowerCase()) ||
      product.name?.toLowerCase().includes(query.toLowerCase()) ||
      product.itemCode?.toLowerCase().includes(query.toLowerCase())
    );
  }

  private async getCurrentStock(itemCode: string): Promise<number> {
    // This would integrate with the actual inventory system
    // For now, return a placeholder
    return 0;
  }

  private async updateStock(itemCode: string, quantity: number, action: 'add' | 'subtract'): Promise<void> {
    // This would integrate with the actual inventory system
    console.log(`${action} ${quantity} units to ${itemCode}`);
  }

  private async setStock(itemCode: string, quantity: number): Promise<void> {
    // This would integrate with the actual inventory system
    console.log(`Set ${itemCode} stock to ${quantity}`);
  }

  private generateItemCode(productName: string): string {
    return productName.replace(/\s+/g, '_').toUpperCase().substring(0, 10);
  }

  // Public methods for session management
  async processAction(actionType: string, actionData: any, sessionId: string): Promise<ChatMessage> {
    const session = this.getOrCreateSession(sessionId);
    
    // Handle button/action clicks
    switch (actionType) {
      case 'process_payment':
        return await this.handleCreateSale({
          intent: 'create_sale',
          entities: { paymentMethod: actionData.paymentMethod },
          stage: 'processing_payment',
          sessionData: session.currentContext?.sessionData || {}
        }, session);
        
      default:
        return this.createAssistantMessage("Action processed.");
    }
  }

  getSession(sessionId: string): ConversationSession | null {
    return this.sessions.get(sessionId) || null;
  }

  clearSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  async shutdown(): Promise<void> {
    this.sessions.clear();
    this.isInitialized = false;
  }
}