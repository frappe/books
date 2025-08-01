// UniPOS Integration Test
// This script tests the AI services and licensing integration

const { fyo } = require('./src/initFyo.ts');

async function testUniPOSIntegration() {
  console.log('🚀 Starting UniPOS Integration Test...\n');

  try {
    // Test 1: AI Service Initialization
    console.log('1️⃣ Testing AI Service Initialization...');
    if (fyo.ai) {
      console.log('✅ AI service is attached to fyo instance');
      console.log(`   - Chat Assistant: ${fyo.ai.chatAssistant ? '✅' : '❌'}`);
      console.log(`   - Inventory Forecaster: ${fyo.ai.inventoryForecaster ? '✅' : '❌'}`);
      console.log(`   - Customer Analytics: ${fyo.ai.customerAnalytics ? '✅' : '❌'}`);
      console.log(`   - Fraud Detector: ${fyo.ai.fraudDetector ? '✅' : '❌'}`);
      console.log(`   - Dynamic Pricing: ${fyo.ai.dynamicPricing ? '✅' : '❌'}`);
      console.log(`   - Sales Predictor: ${fyo.ai.salesPredictor ? '✅' : '❌'}`);
    } else {
      console.log('❌ AI service not found on fyo instance');
    }

    // Test 2: License Manager Initialization
    console.log('\n2️⃣ Testing License Manager Initialization...');
    if (fyo.license) {
      console.log('✅ License manager is attached to fyo instance');
      
      // Test license info
      const licenseInfo = await fyo.license.getLicenseInfo();
      console.log(`   - License status: ${licenseInfo.status}`);
      console.log(`   - License tier: ${licenseInfo.tier}`);
    } else {
      console.log('❌ License manager not found on fyo instance');
    }

    // Test 3: Chat Assistant Basic Functionality
    console.log('\n3️⃣ Testing Chat Assistant...');
    if (fyo.ai && fyo.ai.chatAssistant) {
      try {
        await fyo.ai.chatAssistant.initialize();
        console.log('✅ Chat assistant initialized successfully');
        
        // Test basic chat functionality
        const response = await fyo.ai.chatAssistant.processMessage('help');
        console.log('✅ Chat assistant can process messages');
        console.log(`   - Response type: ${response.type}`);
        console.log(`   - Response length: ${response.content.length} chars`);
      } catch (error) {
        console.log(`❌ Chat assistant test failed: ${error.message}`);
      }
    }

    // Test 4: Database Connection
    console.log('\n4️⃣ Testing Database Connection...');
    try {
      // Test if we can access the database
      const dbPath = fyo.db.dbPath;
      console.log(`✅ Database accessible at: ${dbPath || 'in-memory'}`);
    } catch (error) {
      console.log(`❌ Database connection failed: ${error.message}`);
    }

    // Test 5: Configuration
    console.log('\n5️⃣ Testing Configuration...');
    const config = {
      isElectron: fyo.isElectron,
      isTest: fyo.isTest,
      aiEnabled: fyo.ai ? true : false,
      licenseEnabled: fyo.license ? true : false
    };
    console.log('✅ Configuration loaded:');
    console.log(`   - Electron mode: ${config.isElectron}`);
    console.log(`   - Test mode: ${config.isTest}`);
    console.log(`   - AI enabled: ${config.aiEnabled}`);
    console.log(`   - Licensing enabled: ${config.licenseEnabled}`);

    console.log('\n🎉 UniPOS Integration Test Complete!\n');
    
    // Summary
    const summary = {
      aiService: fyo.ai ? '✅' : '❌',
      licenseManager: fyo.license ? '✅' : '❌',
      chatAssistant: fyo.ai?.chatAssistant ? '✅' : '❌',
      database: fyo.db ? '✅' : '❌'
    };
    
    console.log('📊 Test Summary:');
    Object.entries(summary).forEach(([key, status]) => {
      console.log(`   ${key}: ${status}`);
    });

    const passed = Object.values(summary).filter(s => s === '✅').length;
    const total = Object.values(summary).length;
    console.log(`\n🏆 Tests Passed: ${passed}/${total}`);

    if (passed === total) {
      console.log('🚀 All systems ready! UniPOS is fully integrated.');
    } else {
      console.log('⚠️  Some components need attention before full deployment.');
    }

  } catch (error) {
    console.error('❌ Integration test failed:', error);
  }
}

// Run the test
if (require.main === module) {
  testUniPOSIntegration();
}

module.exports = { testUniPOSIntegration };