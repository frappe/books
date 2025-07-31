<template>
  <div class="unipos-container h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
    <!-- Top Navigation Bar -->
    <nav class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-6 py-3 flex items-center justify-between">
      <div class="flex items-center space-x-4">
        <div class="flex items-center space-x-2">
          <div class="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
            <span class="text-white font-bold text-sm">U</span>
          </div>
          <h1 class="text-xl font-semibold text-gray-900 dark:text-white">UniPOS</h1>
        </div>
        
        <!-- AI Status Indicator -->
        <div v-if="licenseInfo?.limitations.hasAI" class="flex items-center space-x-2 px-3 py-1 bg-green-100 dark:bg-green-900 rounded-full">
          <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span class="text-xs text-green-700 dark:text-green-300 font-medium">AI Active</span>
        </div>
      </div>

      <div class="flex items-center space-x-4">
        <!-- License Tier Badge -->
        <div class="px-3 py-1 rounded-full text-xs font-medium"
             :class="getLicenseBadgeClasses()">
          {{ licenseInfo?.tier?.toUpperCase() }}
        </div>

        <!-- Quick Actions -->
        <button @click="showInventoryAlerts = true" 
                class="relative p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
          <feather-icon name="bell" class="w-5 h-5" />
          <span v-if="inventoryAlertsCount > 0" 
                class="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {{ inventoryAlertsCount }}
          </span>
        </button>

        <button @click="toggleAIDashboard" 
                v-if="licenseInfo?.limitations.hasAI"
                class="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
          <feather-icon name="zap" class="w-5 h-5" />
        </button>

        <button @click="showSettings = true" 
                class="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
          <feather-icon name="settings" class="w-5 h-5" />
        </button>
      </div>
    </nav>

    <!-- Main Content Area -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Product Catalog Section -->
      <div class="w-2/3 p-6 overflow-auto">
        <!-- Search and Filters -->
        <div class="mb-6">
          <div class="relative">
            <feather-icon name="search" class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              v-model="searchTerm"
              @input="handleSearch"
              type="text"
              placeholder="Search products or scan barcode..."
              class="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>

          <!-- AI Recommendations Banner -->
          <div v-if="aiRecommendations.length > 0 && licenseInfo?.limitations.hasAI" 
               class="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div class="flex items-center space-x-2 mb-2">
              <feather-icon name="zap" class="w-4 h-4 text-blue-500" />
              <span class="text-sm font-medium text-blue-700 dark:text-blue-300">AI Recommendations</span>
            </div>
            <div class="flex flex-wrap gap-2">
              <button v-for="item in aiRecommendations.slice(0, 3)" :key="item.code"
                      @click="addRecommendedItem(item)"
                      class="px-3 py-1 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 rounded-full text-xs hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors">
                {{ item.name }}
              </button>
            </div>
          </div>
        </div>

        <!-- Product Grid -->
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          <div v-for="item in filteredItems" :key="item.name"
               @click="addItemToCart(item)"
               class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-105">
            
            <!-- Product Image -->
            <div class="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg mb-3 flex items-center justify-center">
              <img v-if="item.image" :src="item.image" :alt="item.name" class="w-full h-full object-cover rounded-lg" />
              <feather-icon v-else name="package" class="w-8 h-8 text-gray-400" />
            </div>

            <!-- Product Info -->
            <h3 class="font-medium text-sm text-gray-900 dark:text-white mb-1 truncate">{{ item.itemName || item.name }}</h3>
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-2">{{ item.itemCode }}</p>
            
            <!-- Price and Stock -->
            <div class="flex items-center justify-between">
              <span class="font-semibold text-lg text-gray-900 dark:text-white">
                {{ formatCurrency(item.rate || 0) }}
              </span>
              <span v-if="getStockLevel(item.name)" 
                    class="text-xs px-2 py-1 rounded-full"
                    :class="getStockLevelClasses(getStockLevel(item.name))">
                {{ getStockLevel(item.name) }}
              </span>
            </div>

            <!-- AI Price Optimization Indicator -->
            <div v-if="priceOptimizations[item.name] && licenseInfo?.limitations.hasAI" 
                 class="mt-2 flex items-center space-x-1">
              <feather-icon name="trending-up" class="w-3 h-3 text-green-500" />
              <span class="text-xs text-green-600 dark:text-green-400">
                {{ priceOptimizations[item.name] > 0 ? '+' : '' }}{{ priceOptimizations[item.name] }}% optimal
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Cart and Checkout Section -->
      <div class="w-1/3 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col">
        <!-- Customer Selection -->
        <div class="p-4 border-b border-gray-200 dark:border-gray-700">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Customer</label>
          <div class="relative">
            <input
              v-model="selectedCustomer"
              @input="searchCustomers"
              type="text"
              placeholder="Select or add customer..."
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <!-- Customer AI insights -->
            <div v-if="customerInsights && licenseInfo?.limitations.hasAI" 
                 class="mt-2 p-2 bg-purple-50 dark:bg-purple-900/20 rounded-md">
              <div class="flex items-center space-x-1 mb-1">
                <feather-icon name="user" class="w-3 h-3 text-purple-500" />
                <span class="text-xs font-medium text-purple-700 dark:text-purple-300">Customer Insights</span>
              </div>
              <p class="text-xs text-purple-600 dark:text-purple-400">
                Segment: {{ customerInsights.segment }} | LTV: {{ formatCurrency(customerInsights.lifetimeValue) }}
              </p>
            </div>
          </div>
        </div>

        <!-- Cart Items -->
        <div class="flex-1 overflow-auto p-4">
          <h3 class="font-medium text-gray-900 dark:text-white mb-4">Cart ({{ cartItems.length }})</h3>
          
          <div v-if="cartItems.length === 0" class="text-center text-gray-500 dark:text-gray-400 py-8">
            <feather-icon name="shopping-cart" class="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No items in cart</p>
          </div>

          <div v-else class="space-y-3">
            <div v-for="(item, index) in cartItems" :key="index"
                 class="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div class="flex-1">
                <h4 class="font-medium text-sm text-gray-900 dark:text-white">{{ item.name }}</h4>
                <p class="text-xs text-gray-500 dark:text-gray-400">{{ formatCurrency(item.rate) }} each</p>
              </div>
              
              <div class="flex items-center space-x-2">
                <button @click="decrementQuantity(index)" 
                        class="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-500">
                  <feather-icon name="minus" class="w-4 h-4" />
                </button>
                <span class="w-8 text-center font-medium text-gray-900 dark:text-white">{{ item.quantity }}</span>
                <button @click="incrementQuantity(index)"
                        class="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-500">
                  <feather-icon name="plus" class="w-4 h-4" />
                </button>
              </div>

              <button @click="removeFromCart(index)"
                      class="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">
                <feather-icon name="trash-2" class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <!-- Cart Totals -->
        <div class="p-4 border-t border-gray-200 dark:border-gray-700">
          <div class="space-y-2 mb-4">
            <div class="flex justify-between text-sm">
              <span class="text-gray-600 dark:text-gray-400">Subtotal:</span>
              <span class="text-gray-900 dark:text-white">{{ formatCurrency(subtotal) }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-600 dark:text-gray-400">Tax:</span>
              <span class="text-gray-900 dark:text-white">{{ formatCurrency(tax) }}</span>
            </div>
            <div class="flex justify-between text-lg font-semibold">
              <span class="text-gray-900 dark:text-white">Total:</span>
              <span class="text-gray-900 dark:text-white">{{ formatCurrency(total) }}</span>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="space-y-2">
            <button @click="processPayment"
                    :disabled="cartItems.length === 0"
                    class="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-medium rounded-lg transition-colors disabled:cursor-not-allowed">
              Process Payment
            </button>
            
            <div class="grid grid-cols-2 gap-2">
              <button @click="holdTransaction"
                      :disabled="cartItems.length === 0"
                      class="py-2 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-300 text-white font-medium rounded-lg transition-colors disabled:cursor-not-allowed">
                Hold
              </button>
              <button @click="clearCart"
                      :disabled="cartItems.length === 0"
                      class="py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white font-medium rounded-lg transition-colors disabled:cursor-not-allowed">
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- AI Dashboard Sidebar -->
    <div v-if="showAIDashboard && licenseInfo?.limitations.hasAI" 
         class="fixed inset-y-0 right-0 w-80 bg-white dark:bg-gray-800 shadow-xl border-l border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out z-50">
      <div class="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">AI Insights</h2>
        <button @click="showAIDashboard = false" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
          <feather-icon name="x" class="w-5 h-5" />
        </button>
      </div>

      <div class="p-4 overflow-auto h-full pb-16">
        <!-- Sales Forecast -->
        <div class="mb-6">
          <h3 class="font-medium text-gray-900 dark:text-white mb-3">Sales Forecast</h3>
          <div class="space-y-2">
            <div v-for="forecast in salesForecasts" :key="forecast.date"
                 class="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
              <span class="text-sm text-gray-600 dark:text-gray-400">{{ formatDate(forecast.date) }}</span>
              <span class="font-medium text-gray-900 dark:text-white">{{ forecast.predicted_sales }} sales</span>
            </div>
          </div>
        </div>

        <!-- Inventory Alerts -->
        <div class="mb-6">
          <h3 class="font-medium text-gray-900 dark:text-white mb-3">Inventory Alerts</h3>
          <div class="space-y-2">
            <div v-for="alert in inventoryAlerts" :key="alert.itemCode"
                 class="p-3 rounded border-l-4"
                 :class="getAlertClasses(alert.urgency)">
              <p class="font-medium text-sm">{{ alert.itemName }}</p>
              <p class="text-xs text-gray-600 dark:text-gray-400">{{ alert.recommendedAction }}</p>
            </div>
          </div>
        </div>

        <!-- Price Optimizations -->
        <div>
          <h3 class="font-medium text-gray-900 dark:text-white mb-3">Price Recommendations</h3>
          <div class="space-y-2">
            <div v-for="optimization in priceOptimizationList" :key="optimization.itemCode"
                 class="p-3 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
              <p class="font-medium text-sm text-green-800 dark:text-green-200">{{ optimization.itemName }}</p>
              <p class="text-xs text-green-600 dark:text-green-400">
                {{ optimization.priceChangePercent > 0 ? 'Increase' : 'Decrease' }} by {{ Math.abs(optimization.priceChangePercent).toFixed(1) }}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Overlay for AI Dashboard -->
    <div v-if="showAIDashboard" @click="showAIDashboard = false" 
         class="fixed inset-0 bg-black bg-opacity-50 z-40"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { fyo } from 'src/initFyo';
import { ModelNameEnum } from 'models/types';
import FeatherIcon from 'src/components/FeatherIcon.vue';
import type { LicenseInfo } from 'src/licensing/LicenseManager';
import type { CustomerInsight } from 'src/ai/services/CustomerAnalytics';
import type { InventoryAlert } from 'src/ai/services/InventoryForecaster';
import type { PriceOptimization } from 'src/ai/services/DynamicPricing';
import type { SalesForcast } from 'src/ai/services/SalesPredictor';

// Reactive data
const searchTerm = ref('');
const selectedCustomer = ref('');
const cartItems = ref<any[]>([]);
const items = ref<any[]>([]);
const showAIDashboard = ref(false);
const showInventoryAlerts = ref(false);
const showSettings = ref(false);

// License and AI data
const licenseInfo = ref<LicenseInfo | null>(null);
const customerInsights = ref<CustomerInsight | null>(null);
const inventoryAlerts = ref<InventoryAlert[]>([]);
const priceOptimizations = ref<Record<string, number>>({});
const priceOptimizationList = ref<PriceOptimization[]>([]);
const salesForecasts = ref<SalesForcast[]>([]);
const aiRecommendations = ref<any[]>([]);

// Computed properties
const filteredItems = computed(() => {
  if (!searchTerm.value) return items.value;
  
  const term = searchTerm.value.toLowerCase();
  return items.value.filter(item => 
    item.itemName?.toLowerCase().includes(term) ||
    item.name?.toLowerCase().includes(term) ||
    item.itemCode?.toLowerCase().includes(term)
  );
});

const subtotal = computed(() => {
  return cartItems.value.reduce((sum, item) => sum + (item.rate * item.quantity), 0);
});

const tax = computed(() => {
  return subtotal.value * 0.1; // 10% tax for demo
});

const total = computed(() => {
  return subtotal.value + tax.value;
});

const inventoryAlertsCount = computed(() => {
  return inventoryAlerts.value.filter(alert => alert.urgency === 'critical').length;
});

// Methods
const getLicenseBadgeClasses = () => {
  const tier = licenseInfo.value?.tier;
  switch (tier) {
    case 'starter':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    case 'professional':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
    case 'enterprise':
      return 'bg-gold-100 text-gold-800 dark:bg-gold-900 dark:text-gold-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  }
};

const getStockLevel = (itemCode: string): number => {
  // Placeholder - would get from inventory system
  return Math.floor(Math.random() * 100);
};

const getStockLevelClasses = (stock: number) => {
  if (stock < 10) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
  if (stock < 50) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
  return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
};

const getAlertClasses = (urgency: string) => {
  switch (urgency) {
    case 'critical':
      return 'bg-red-50 border-red-500 dark:bg-red-900/20 dark:border-red-500';
    case 'warning':
      return 'bg-yellow-50 border-yellow-500 dark:bg-yellow-900/20 dark:border-yellow-500';
    default:
      return 'bg-blue-50 border-blue-500 dark:bg-blue-900/20 dark:border-blue-500';
  }
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
};

const addItemToCart = (item: any) => {
  const existingIndex = cartItems.value.findIndex(cartItem => cartItem.name === item.name);
  
  if (existingIndex >= 0) {
    cartItems.value[existingIndex].quantity += 1;
  } else {
    cartItems.value.push({
      ...item,
      quantity: 1
    });
  }
};

const addRecommendedItem = (item: any) => {
  addItemToCart(item);
};

const incrementQuantity = (index: number) => {
  cartItems.value[index].quantity += 1;
};

const decrementQuantity = (index: number) => {
  if (cartItems.value[index].quantity > 1) {
    cartItems.value[index].quantity -= 1;
  } else {
    removeFromCart(index);
  }
};

const removeFromCart = (index: number) => {
  cartItems.value.splice(index, 1);
};

const clearCart = () => {
  cartItems.value = [];
};

const handleSearch = async () => {
  // Trigger AI-powered search suggestions if available
  if (licenseInfo.value?.limitations.hasAI && searchTerm.value.length > 2) {
    // Get AI recommendations based on search
    try {
      // This would call the AI service for intelligent search suggestions
      console.log('AI-powered search:', searchTerm.value);
    } catch (error) {
      console.error('AI search error:', error);
    }
  }
};

const searchCustomers = async () => {
  // Implement customer search and AI insights
  if (licenseInfo.value?.limitations.hasAI && selectedCustomer.value.length > 2) {
    try {
      const insights = await (fyo as any).ai.customerAnalytics.getCustomerInsights(selectedCustomer.value);
      if (insights.length > 0) {
        customerInsights.value = insights[0];
      }
    } catch (error) {
      console.error('Customer insights error:', error);
    }
  }
};

const toggleAIDashboard = () => {
  showAIDashboard.value = !showAIDashboard.value;
};

const processPayment = () => {
  // Implement payment processing
  console.log('Processing payment for:', total.value);
  
  // Check for fraud using AI
  if (licenseInfo.value?.limitations.hasAI) {
    checkForFraud();
  }
  
  // Clear cart after successful payment
  clearCart();
};

const checkForFraud = async () => {
  try {
    const transactionData = {
      grandTotal: total.value,
      party: selectedCustomer.value,
      date: new Date(),
      items: cartItems.value
    };
    
    const fraudAnalysis = await (fyo as any).ai.fraudDetector.analyzeTransaction(transactionData);
    
    if (fraudAnalysis.isFraud) {
      alert(`Fraud Alert: ${fraudAnalysis.reasons.join(', ')}`);
    }
  } catch (error) {
    console.error('Fraud detection error:', error);
  }
};

const holdTransaction = () => {
  // Implement transaction hold functionality
  console.log('Holding transaction');
};

const loadItems = async () => {
  try {
    const itemsData = await fyo.db.getAllRaw(ModelNameEnum.Item);
    items.value = itemsData;
  } catch (error) {
    console.error('Error loading items:', error);
  }
};

const loadAIData = async () => {
  if (!licenseInfo.value?.limitations.hasAI) return;
  
  try {
    // Load inventory alerts
    inventoryAlerts.value = await (fyo as any).ai.inventoryForecaster.getInventoryAlerts();
    
    // Load price optimizations
    priceOptimizationList.value = await (fyo as any).ai.dynamicPricing.getPriceOptimizations();
    
    // Create price optimization map for quick lookup
    priceOptimizations.value = {};
    priceOptimizationList.value.forEach(opt => {
      priceOptimizations.value[opt.itemCode] = opt.priceChangePercent;
    });
    
    // Load sales forecasts
    salesForecasts.value = await (fyo as any).ai.salesPredictor.predictSales(7);
    
  } catch (error) {
    console.error('Error loading AI data:', error);
  }
};

const initializeServices = async () => {
  try {
    // Initialize licensing
    await (fyo as any).license.initialize();
    licenseInfo.value = (fyo as any).license.getLicenseInfo();
    
    // Initialize AI services if licensed
    if (licenseInfo.value?.limitations.hasAI) {
      await (fyo as any).ai.initialize();
      await loadAIData();
    }
    
  } catch (error) {
    console.error('Service initialization error:', error);
  }
};

// Lifecycle
onMounted(async () => {
  await initializeServices();
  await loadItems();
});

// Watch for search term changes to trigger AI recommendations
watch(searchTerm, async (newTerm) => {
  if (licenseInfo.value?.limitations.hasAI && newTerm.length > 2) {
    // Get AI-powered product recommendations
    // This would be implemented based on customer history and search patterns
  }
});
</script>

<style scoped>
/* Additional custom styles if needed */
.unipos-container {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Smooth animations */
.transition-all {
  transition: all 0.2s ease-in-out;
}

/* Focus states for accessibility */
.focus-ring:focus {
  outline: none;
  ring: 2px;
  ring-color: #3b82f6;
  ring-opacity: 0.5;
}

/* Custom scrollbar */
.overflow-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-auto::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.dark .overflow-auto::-webkit-scrollbar-thumb {
  background: #4b5563;
}
</style>