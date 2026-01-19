<template>
  <div class="flex-1 flex justify-center items-center bg-gray-25 dark:bg-gray-900">
    <div class="w-full max-w-sm shadow-lg rounded-lg border dark:border-gray-800 bg-white dark:bg-gray-875 p-8">
      <h1 class="text-2xl font-semibold dark:text-gray-25 mb-6 text-center">{{ t`Login` }}</h1>
      <div class="space-y-4">
        <FormControl
          :df="{ label: t`Username`, fieldname: 'username', fieldtype: 'Data' }"
          :value="username"
          :show-label="true"
          border
          @change="(val) => (username = val)"
        />
        <FormControl
          :df="{ label: t`Password`, fieldname: 'password', fieldtype: 'Secret' }"
          :value="password"
          :show-label="true"
          border
          @change="(val) => (password = val)"
        />
        <Button
          type="primary"
          class="w-full mt-6"
          @click="login"
        >
          {{ t`Sign in` }}
        </Button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { useRouter } from 'vue-router';
import Button from 'src/components/Button.vue';
import FormControl from 'src/components/Controls/FormControl.vue';

export default defineComponent({
  components: {
    Button,
    FormControl,
  },
  setup() {
    const username = ref('');
    const password = ref('');
    const router = useRouter();

    const login = () => {
      // Simple mock login
      if (username.value === 'super admin' && password.value === 'super admin') {
        localStorage.setItem('session_token', 'mock_token');
        localStorage.setItem('username', username.value);
        router.push('/');
      } else {
        alert('Invalid credentials');
      }
    };

    return { username, password, login };
  }
});
</script>
