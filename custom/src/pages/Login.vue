<template>
  <div class="flex-1 flex justify-center items-center bg-gray-25 dark:bg-gray-900">
    <div class="w-full max-w-sm shadow-lg rounded-lg border dark:border-gray-800 bg-white dark:bg-gray-875 p-8">
      <h1 class="text-2xl font-semibold dark:text-gray-25 mb-6 text-center">{{ t`Login` }}</h1>
      <div class="space-y-4">
        <FormControl
          :df="{ label: t`Email`, fieldname: 'email', fieldtype: 'Data' }"
          :value="email"
          :show-label="true"
          :read-only="isLoading"
          border
          @change="(val) => (email = val)"
        />
        <div>
          <div class="text-gray-600 dark:text-gray-500 text-sm mb-1">
            {{ t`Password` }}
          </div>
          <div class="relative rounded border border-gray-200 dark:border-gray-800 bg-gray-25 dark:bg-gray-875 focus-within:bg-gray-100 dark:focus-within:bg-gray-850" :class="{ 'bg-gray-50 dark:bg-gray-850': isLoading }">
            <input
              ref="passwordInput"
              :type="showPassword ? 'text' : 'password'"
              v-model="password"
              :readonly="isLoading"
              :tabindex="isLoading ? '-1' : '0'"
              spellcheck="false"
              class="
                bg-transparent
                text-base
                focus:outline-none
                w-full
                placeholder-gray-500
                px-3
                py-2
                pr-10
                text-gray-900
                dark:text-gray-100
              "
              :class="{
                'text-gray-800 dark:text-gray-300 cursor-default': isLoading
              }"
              :placeholder="t`Password`"
            />
            <button
              type="button"
              @click="showPassword = !showPassword"
              :disabled="isLoading"
              :tabindex="isLoading ? '-1' : '0'"
              class="
                absolute
                right-3
                top-1/2
                transform
                -translate-y-1/2
                text-gray-500
                hover:text-gray-700
                dark:text-gray-400
                dark:hover:text-gray-200
                focus:outline-none
                disabled:opacity-50
                disabled:cursor-not-allowed
              "
            >
              <feather-icon
                :name="showPassword ? 'eye-off' : 'eye'"
                class="w-4 h-4"
              />
            </button>
          </div>
        </div>
        <Button
          type="primary"
          class="w-full mt-6"
          :loading="isLoading"
          @click="login"
        >
          {{ isLoading ? t`Signing in...` : t`Sign in` }}
        </Button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { t } from 'fyo';
import { defineComponent, ref } from 'vue';
import Button from 'src/components/Button.vue';
import FormControl from 'src/components/Controls/FormControl.vue';
import { fyo } from 'src/initFyo';
import { showToast } from 'src/utils/interactive';
import { User } from 'custom/models/User';

export default defineComponent({
  name: 'Login',
  components: {
    Button,
    FormControl,
  },
  emits: ['login-success'],
  setup(_, { emit }) {
    const email = ref('');
    const password = ref('');
    const isLoading = ref(false);
    const showPassword = ref(false);

    const login = async () => {
      if (!email.value || !password.value) {
        showToast({
          message: t`Please enter email and password`,
          type: 'warning',
        });
        return;
      }

      isLoading.value = true;

      try {
        // Authenticate a user
        const user = await User.authenticate(fyo, email.value, password.value);

        if (!user) {
          showToast({
            message: t`Invalid email or password`,
            type: 'error',
          });
          isLoading.value = false;
          return;
        }

        // Generate session token
        const sessionToken = generateSessionToken();
        
        // Store session in localStorage
        localStorage.setItem('session_token', sessionToken);
        localStorage.setItem('current_user', user.name as string);
        localStorage.setItem('current_role', user.role as string);
        if (user.organization) {
          localStorage.setItem('current_organization', user.organization as string);
        }

        // Update SystemUser singleton if it exists
        try {
          const systemUser = await fyo.doc.getSingle('SystemUser');
          await systemUser.setAndSync({
            current_user: user.name,
            current_role: user.role,
            current_organization: user.organization,
            session_token: sessionToken,
          });
        } catch (error) {
          // SystemUser singleton doesn't exist or failed to update
          // This is okay - we've already stored in localStorage
          console.warn('Could not update SystemUser singleton:', error);
        }

        showToast({
          message: t`Welcome back, ${user.full_name}!`,
          type: 'success',
        });

        // Redirect to home page
        // The router will handle navigation since we now have a session_token
        window.location.href = '/';
        
        // Also emit event for any listeners
        emit('login-success', user);
      } catch (error) {
        console.error('Login error:', error);
        showToast({
          message: t`An error occurred during login. Please try again.`,
          type: 'error',
        });
      } finally {
        isLoading.value = false;
      }
    };

    const generateSessionToken = () => {
      return Math.random().toString(36).substring(2) + Date.now().toString(36);
    };

    return { email, password, isLoading, showPassword, login };
  },
});
</script>
