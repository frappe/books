<template>
  <div class="chat-interface h-full flex flex-col bg-white dark:bg-gray-800">
    <!-- Chat Header -->
    <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-500 to-purple-600">
      <div class="flex items-center space-x-3">
        <div class="w-10 h-10 bg-white rounded-full flex items-center justify-center">
          <feather-icon name="message-circle" class="w-6 h-6 text-blue-500" />
        </div>
        <div>
          <h3 class="font-semibold text-white">UniPOS Assistant</h3>
          <p class="text-xs text-blue-100">AI-powered POS helper</p>
        </div>
      </div>
      
      <div class="flex items-center space-x-2">
        <button @click="clearChat" 
                class="text-white hover:text-blue-200 transition-colors"
                title="Clear chat">
          <feather-icon name="refresh-cw" class="w-4 h-4" />
        </button>
        <button @click="$emit('close')" 
                class="text-white hover:text-blue-200 transition-colors"
                title="Close chat">
          <feather-icon name="x" class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="p-3 bg-gray-50 dark:bg-gray-750 border-b border-gray-200 dark:border-gray-700">
      <div class="flex flex-wrap gap-2">
        <button v-for="action in quickActions" :key="action.label"
                @click="sendMessage(action.command)"
                class="px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors">
          {{ action.label }}
        </button>
      </div>
    </div>

    <!-- Messages Container -->
    <div ref="messagesContainer" 
         class="flex-1 overflow-y-auto p-4 space-y-4">
      
      <!-- Welcome Message -->
      <div v-if="messages.length === 0" class="text-center py-8">
        <div class="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
          <feather-icon name="zap" class="w-8 h-8 text-white" />
        </div>
        <h4 class="font-semibold text-gray-900 dark:text-white mb-2">Welcome to UniPOS Assistant!</h4>
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
          I can help you with products, sales, inventory, and reports using simple conversation.
        </p>
        <p class="text-xs text-gray-500 dark:text-gray-500">
          Try saying: "Add product Blue T-shirt" or "Show today's sales"
        </p>
      </div>

      <!-- Chat Messages -->
      <div v-for="message in messages" :key="message.id"
           class="flex"
           :class="message.type === 'user' ? 'justify-end' : 'justify-start'">
        
        <!-- User Message -->
        <div v-if="message.type === 'user'"
             class="max-w-xs lg:max-w-md px-4 py-2 bg-blue-500 text-white rounded-lg rounded-br-none">
          <p class="text-sm">{{ message.content }}</p>
          <p class="text-xs opacity-75 mt-1">{{ formatTime(message.timestamp) }}</p>
        </div>

        <!-- Assistant Message -->
        <div v-else
             class="max-w-xs lg:max-w-md">
          <div class="flex items-start space-x-2">
            <div class="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mt-1">
              <feather-icon name="cpu" class="w-3 h-3 text-white" />
            </div>
            <div class="flex-1">
              <div class="bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-lg rounded-bl-none">
                <div class="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{{ message.content }}</div>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ formatTime(message.timestamp) }}</p>
              </div>
              
              <!-- Action Buttons -->
              <div v-if="message.actions && message.actions.length > 0" 
                   class="mt-2 flex flex-wrap gap-2">
                <button v-for="action in message.actions" :key="action.label"
                        @click="handleAction(action)"
                        :class="getActionButtonClasses(action.type)"
                        class="px-3 py-1 text-xs rounded-full transition-colors">
                  {{ action.label }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Typing Indicator -->
      <div v-if="isTyping" class="flex justify-start">
        <div class="flex items-start space-x-2">
          <div class="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <feather-icon name="cpu" class="w-3 h-3 text-white" />
          </div>
          <div class="bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-lg rounded-bl-none">
            <div class="flex space-x-1">
              <div class="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
              <div class="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
              <div class="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Input Area -->
    <div class="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
      <div class="flex space-x-2">
        <div class="flex-1 relative">
          <input
            ref="messageInput"
            v-model="currentMessage"
            @keydown.enter="handleSendMessage"
            @keydown.up="handleUpArrow"
            @keydown.down="handleDownArrow"
            type="text"
            placeholder="Type your message... (e.g., 'Add product Blue T-shirt, $19.99')"
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            :disabled="isTyping"
          />
          
          <!-- Voice Input Button -->
          <button @click="toggleVoiceInput"
                  class="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  :class="{ 'text-red-500': isListening }"
                  title="Voice input">
            <feather-icon :name="isListening ? 'mic' : 'mic-off'" class="w-4 h-4" />
          </button>
        </div>
        
        <button @click="handleSendMessage"
                :disabled="!currentMessage.trim() || isTyping"
                class="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors">
          <feather-icon name="send" class="w-4 h-4" />
        </button>
      </div>

      <!-- Quick Suggestions -->
      <div v-if="suggestions.length > 0" class="mt-2 flex flex-wrap gap-1">
        <button v-for="suggestion in suggestions" :key="suggestion"
                @click="sendMessage(suggestion)"
                class="px-2 py-1 text-xs bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
          {{ suggestion }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted, onUnmounted } from 'vue';
import { fyo } from 'src/initFyo';
import FeatherIcon from 'src/components/FeatherIcon.vue';
import type { ChatMessage, ChatAction } from 'src/ai/services/ChatAssistant';

// Props and Emits
const emit = defineEmits(['close']);

// Reactive data
const messages = ref<ChatMessage[]>([]);
const currentMessage = ref('');
const isTyping = ref(false);
const isListening = ref(false);
const messageHistory = ref<string[]>([]);
const historyIndex = ref(-1);
const suggestions = ref<string[]>([]);
const messagesContainer = ref<HTMLElement>();
const messageInput = ref<HTMLInputElement>();

// Quick actions for new users
const quickActions = ref([
  { label: '➕ Add Product', command: 'Add product' },
  { label: '💰 Create Sale', command: 'Create sale' },
  { label: '📊 Sales Report', command: 'Show today\'s sales' },
  { label: '🔍 Find Product', command: 'Find' },
  { label: '❓ Help', command: 'Help' }
]);

// Speech recognition setup
let recognition: any = null;

onMounted(() => {
  // Initialize speech recognition if available
  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      currentMessage.value = transcript;
      isListening.value = false;
    };
    
    recognition.onerror = () => {
      isListening.value = false;
    };
    
    recognition.onend = () => {
      isListening.value = false;
    };
  }
  
  // Load chat history from localStorage
  loadChatHistory();
  
  // Focus input
  nextTick(() => {
    messageInput.value?.focus();
  });
});

onUnmounted(() => {
  saveChatHistory();
});

// Methods
const sendMessage = async (message: string = currentMessage.value) => {
  if (!message.trim() || isTyping.value) return;
  
  // Add to history
  if (!messageHistory.value.includes(message)) {
    messageHistory.value.unshift(message);
    if (messageHistory.value.length > 20) {
      messageHistory.value = messageHistory.value.slice(0, 20);
    }
  }
  historyIndex.value = -1;
  
  // Clear input and suggestions
  currentMessage.value = '';
  suggestions.value = [];
  
  // Show typing indicator
  isTyping.value = true;
  
  try {
    // Send message to AI assistant
    const response = await (fyo as any).ai.chatAssistant.processMessage(message);
    
    // Add messages to chat
    messages.value.push({
      id: generateMessageId(),
      type: 'user',
      content: message,
      timestamp: new Date()
    });
    
    // Simulate typing delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500));
    
    messages.value.push(response);
    
    // Generate suggestions based on context
    generateSuggestions(response);
    
  } catch (error) {
    console.error('Chat error:', error);
    messages.value.push({
      id: generateMessageId(),
      type: 'assistant',
      content: 'Sorry, I encountered an error. Please try again.',
      timestamp: new Date()
    });
  } finally {
    isTyping.value = false;
    scrollToBottom();
  }
};

const handleSendMessage = () => {
  if (currentMessage.value.trim()) {
    sendMessage();
  }
};

const handleAction = async (action: ChatAction) => {
  try {
    isTyping.value = true;
    
    const response = await (fyo as any).ai.chatAssistant.processAction(
      action.callback,
      action.data,
      'default'
    );
    
    messages.value.push(response);
    generateSuggestions(response);
    
  } catch (error) {
    console.error('Action error:', error);
    messages.value.push({
      id: generateMessageId(),
      type: 'assistant',
      content: 'Sorry, I couldn\'t process that action. Please try again.',
      timestamp: new Date()
    });
  } finally {
    isTyping.value = false;
    scrollToBottom();
  }
};

const handleUpArrow = () => {
  if (messageHistory.value.length > 0) {
    historyIndex.value = Math.min(historyIndex.value + 1, messageHistory.value.length - 1);
    currentMessage.value = messageHistory.value[historyIndex.value];
  }
};

const handleDownArrow = () => {
  if (historyIndex.value > 0) {
    historyIndex.value--;
    currentMessage.value = messageHistory.value[historyIndex.value];
  } else if (historyIndex.value === 0) {
    historyIndex.value = -1;
    currentMessage.value = '';
  }
};

const toggleVoiceInput = () => {
  if (!recognition) {
    alert('Speech recognition is not supported in your browser.');
    return;
  }
  
  if (isListening.value) {
    recognition.stop();
    isListening.value = false;
  } else {
    recognition.start();
    isListening.value = true;
  }
};

const clearChat = () => {
  messages.value = [];
  suggestions.value = [];
  currentMessage.value = '';
  (fyo as any).ai.chatAssistant.clearSession('default');
  localStorage.removeItem('unipos-chat-history');
};

const generateSuggestions = (response: ChatMessage) => {
  // Generate contextual suggestions based on the response
  suggestions.value = [];
  
  if (response.content.includes('product')) {
    suggestions.value.push('Show inventory', 'Find Blue T-shirt');
  }
  
  if (response.content.includes('sale')) {
    suggestions.value.push('New sale', 'Add customer');
  }
  
  if (response.content.includes('report') || response.content.includes('sales')) {
    suggestions.value.push('Weekly report', 'Best selling products');
  }
  
  // Always include help option
  if (suggestions.value.length < 3) {
    suggestions.value.push('Help');
  }
};

const getActionButtonClasses = (type: string) => {
  switch (type) {
    case 'confirm':
    case 'execute':
      return 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800';
    case 'edit':
      return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-800';
    case 'suggest':
    default:
      return 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800';
  }
};

const formatTime = (timestamp: Date) => {
  return timestamp.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
};

const generateMessageId = () => {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const loadChatHistory = () => {
  try {
    const saved = localStorage.getItem('unipos-chat-history');
    if (saved) {
      const history = JSON.parse(saved);
      messageHistory.value = history.messageHistory || [];
      messages.value = (history.messages || []).map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }));
    }
  } catch (error) {
    console.error('Error loading chat history:', error);
  }
};

const saveChatHistory = () => {
  try {
    localStorage.setItem('unipos-chat-history', JSON.stringify({
      messageHistory: messageHistory.value.slice(0, 10), // Keep last 10 commands
      messages: messages.value.slice(-50) // Keep last 50 messages
    }));
  } catch (error) {
    console.error('Error saving chat history:', error);
  }
};

// Save chat periodically
setInterval(saveChatHistory, 30000); // Every 30 seconds
</script>

<style scoped>
/* Custom scrollbar for messages */
.overflow-y-auto::-webkit-scrollbar {
  width: 4px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 2px;
}

.dark .overflow-y-auto::-webkit-scrollbar-thumb {
  background: #4b5563;
}

/* Smooth message animations */
.chat-interface .flex {
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Typing indicator animation */
.animate-bounce {
  animation: bounce 1.4s infinite;
}

@keyframes bounce {
  0%, 20%, 53%, 80%, 100% {
    transform: translateY(0);
  }
  40%, 43% {
    transform: translateY(-8px);
  }
  70% {
    transform: translateY(-4px);
  }
  90% {
    transform: translateY(-2px);
  }
}
</style>