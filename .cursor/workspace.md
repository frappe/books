# UniPOS Workspace Documentation

## 🏗️ Project Overview

**UniPOS** is a Universal Point of Sale system that transforms Frappe Books into an AI-powered, offline-first POS solution. Built with Vue.js 3, Electron, and SQLite, it provides intelligent automation for inventory, customer analytics, and business operations.

## 📁 Project Structure

```
UniPOS/
├── 📂 src/                          # Main source code
│   ├── 📂 ai/                       # AI Services & ML Models
│   │   ├── index.ts                 # Main AI service orchestrator
│   │   └── 📂 services/             # Individual AI modules
│   │       ├── ChatAssistant.ts     # 🤖 Conversational POS automation
│   │       ├── InventoryForecaster.ts # 📦 Demand prediction & stock optimization
│   │       ├── CustomerAnalytics.ts # 👥 Customer insights & segmentation
│   │       ├── FraudDetector.ts     # 🔐 Transaction security & fraud detection
│   │       ├── DynamicPricing.ts    # 💰 Price optimization & elasticity
│   │       └── SalesPredictor.ts    # 📊 Revenue forecasting & peak analysis
│   ├── 📂 licensing/                # Multi-tier licensing system
│   │   └── LicenseManager.ts        # 🔑 License validation & feature gating
│   ├── 📂 components/               # Vue.js components
│   │   ├── ChatInterface.vue        # 💬 AI chat interface
│   │   └── ... (existing components)
│   ├── 📂 pages/                    # Application pages
│   │   ├── 📂 POS/                  # Point of Sale interfaces
│   │   │   ├── POS.vue              # Classic POS (enhanced with AI navigation)
│   │   │   ├── UniPOS.vue           # 🚀 AI-enhanced POS interface
│   │   │   ├── ClassicPOS.vue       # Original Frappe Books POS
│   │   │   └── ModernPOS.vue        # Modern Frappe Books POS
│   │   └── ...
│   ├── 📂 utils/                    # Utility functions
│   │   ├── sidebarConfig.ts         # Enhanced navigation configuration
│   │   └── ...
│   ├── router.ts                    # Vue Router with UniPOS routes
│   └── initFyo.ts                   # 🎯 Enhanced fyo instance with AI & licensing
├── 📂 schemas/                      # Database schemas
├── 📂 models/                       # Business logic models
├── 📂 fyo/                          # Core Frappe framework
├── 📂 build/                        # Build scripts
├── 📂 .cursor/                      # Cursor IDE configuration
│   ├── settings.json                # IDE workspace settings
│   ├── extensions.json              # Recommended extensions
│   ├── launch.json                  # Debug configurations
│   ├── tasks.json                   # Task definitions
│   └── workspace.md                 # This documentation
├── 📄 UNIPOS_IMPLEMENTATION_SUMMARY.md # Technical implementation details
├── 📄 UNIPOS_AI_CHAT_GUIDE.md      # AI chat automation guide
├── 📄 PHASE_1_COMPLETION_REPORT.md # Phase 1 completion status
├── 📄 test-integration.js           # Integration test suite
└── 📄 package.json                  # Project dependencies & scripts
```

## 🎯 Key Features

### 🤖 AI-Powered Services
- **Conversational POS**: Natural language processing for common operations
- **Inventory Forecasting**: ML-powered demand prediction and stock optimization
- **Customer Analytics**: LTV calculation, churn prediction, and segmentation
- **Fraud Detection**: Real-time transaction analysis and risk assessment
- **Dynamic Pricing**: Price elasticity analysis and optimization
- **Sales Prediction**: Revenue forecasting and peak hour analysis

### 🔐 Multi-Tier Licensing
- **Starter Edition** ($29/month): Core POS features, single location
- **Professional Edition** ($79/month): Multi-location, full AI features
- **Enterprise Edition** ($199/month): White-label, custom development

### 🏗️ Architecture
- **Offline-First**: Complete functionality without internet
- **Local AI Processing**: All ML models run locally using TensorFlow.js
- **Data Ownership**: Complete control over business data
- **Cross-Platform**: Windows, macOS, Linux support

## 🚀 Development Commands

### Quick Start
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run integration tests
node test-integration.js
```

### Cursor IDE Tasks
- **Ctrl+Shift+P** → "Tasks: Run Task" → "UniPOS: Start Development Server"
- **Ctrl+Shift+P** → "Tasks: Run Task" → "UniPOS: Build Production"
- **Ctrl+Shift+P** → "Tasks: Run Task" → "UniPOS: Run Integration Tests"

### Development URLs
- **Development Server**: http://127.0.0.1:6969/
- **Classic POS**: http://127.0.0.1:6969/pos
- **UniPOS (AI-Enhanced)**: http://127.0.0.1:6969/unipos
- **AI Assistant**: http://127.0.0.1:6969/ai-assistant

## 🔧 AI Services API

### Accessing AI Services
```typescript
// All AI services are available via the global fyo instance
import { fyo } from 'src/initFyo';

// Chat Assistant
const response = await fyo.ai.chatAssistant.processMessage("Add product Blue T-shirt, $19.99, stock 100");

// Inventory Forecasting
const demand = await fyo.ai.inventoryForecaster.predictDemand("BLUE_TSHIRT", 30);

// Customer Analytics
const ltv = await fyo.ai.customerAnalytics.calculateLifetimeValue("CUSTOMER_001");

// Fraud Detection
const fraudCheck = await fyo.ai.fraudDetector.analyzeTransaction(transactionData);

// Dynamic Pricing
const optimalPrice = await fyo.ai.dynamicPricing.calculateOptimalPrice("ITEM_001", currentDemand);

// Sales Prediction
const forecast = await fyo.ai.salesPredictor.predictSales(7);
```

### License Management
```typescript
// License information
const licenseInfo = await fyo.license.getLicenseInfo();

// Feature gating
const hasFeature = fyo.license.isFeatureEnabled('advanced_analytics');

// License activation
await fyo.license.activateLicense('LICENSE_KEY');
```

## 🧪 Testing

### Integration Tests
```bash
# Run all integration tests
node test-integration.js

# Expected output:
# 🚀 Starting UniPOS Integration Test...
# ✅ AI service is attached to fyo instance
# ✅ License manager is attached to fyo instance
# ✅ Chat assistant initialized successfully
# ✅ Database accessible
# 🏆 Tests Passed: 4/4
```

### Debug Configurations
Available in Run and Debug panel:
- **UniPOS Development**: Debug the development server
- **Integration Test**: Debug the integration test suite
- **Electron Main Process**: Debug the Electron main process
- **UniPOS Full Stack**: Debug both development server and Electron

## 🎨 UI Components

### ChatInterface.vue
Modern conversational AI interface with:
- Real-time message processing
- Voice input support
- Quick action buttons
- Contextual suggestions
- Persistent chat history

### UniPOS.vue
Enhanced POS interface featuring:
- AI-powered product recommendations
- Real-time inventory alerts
- Customer insights panel
- Dynamic pricing suggestions
- Fraud detection indicators

## 🔄 Git Workflow

### Branches
- `master`: Stable Frappe Books base
- `cursor/setup-unipos-core-structure-and-offline-capabilities-a5f0`: UniPOS development

### Commit Messages
```bash
# Use semantic commit messages
git commit -m "feat: add AI chat assistant for conversational POS operations"
git commit -m "fix: resolve inventory forecasting model loading issue"
git commit -m "docs: update API documentation for licensing system"
```

## 📚 Documentation

- **[Implementation Summary](../UNIPOS_IMPLEMENTATION_SUMMARY.md)**: Technical architecture overview
- **[AI Chat Guide](../UNIPOS_AI_CHAT_GUIDE.md)**: User guide for AI automation
- **[Phase 1 Report](../PHASE_1_COMPLETION_REPORT.md)**: Development progress status

## 🛠️ Troubleshooting

### Common Issues

1. **Development Server Won't Start**
   ```bash
   # Clean and reinstall
   rm -rf node_modules package-lock.json
   npm install
   npm run dev
   ```

2. **AI Services Not Loading**
   ```bash
   # Check integration test
   node test-integration.js
   ```

3. **Build Failures**
   ```bash
   # Clean build artifacts
   rm -rf dist_electron
   npm run build
   ```

### Debug Mode
Enable debug logging:
```bash
DEBUG=unipos:* npm run dev
```

## 🚀 Next Steps

1. **Phase 2**: Feature testing and AI model training
2. **Phase 3**: UI/UX polish and performance optimization
3. **Production**: Deployment and user acceptance testing

---

**Happy coding with UniPOS! 🎉**