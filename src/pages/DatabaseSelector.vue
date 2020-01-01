<template>
  <div class="px-12 py-10 flex-1 bg-white window-drag">
    <h1 class="text-2xl font-semibold">
      {{ _('Welcome to Frappe Accounting') }}
    </h1>
    <p class="text-gray-600">
      {{ _('Create a new file or load an existing one from your computer') }}
    </p>
    <div class="flex mt-10 window-no-drag">
      <div
        @click="newDatabase"
        class="w-1/2 border rounded-xl flex flex-col items-center py-8 px-5 cursor-pointer hover:shadow"
      >
        <div class="w-14 h-14 rounded-full bg-blue-200 relative flex-center">
          <div class="w-12 h-12 absolute rounded-full bg-blue-500 flex-center">
            <feather-icon name="plus" class="text-white w-5 h-5" />
          </div>
        </div>
        <div class="mt-5 font-medium">{{ _('New File') }}</div>
        <div class="mt-2 text-sm text-gray-600 text-center">
          {{ _('Create a new file and store it in your computer.') }}
        </div>
      </div>
      <div
        @click="existingDatabase"
        class="ml-6 w-1/2 border rounded-xl flex flex-col items-center py-8 px-5 cursor-pointer hover:shadow"
      >
        <div class="w-14 h-14 rounded-full bg-green-200 relative flex-center">
          <div class="w-12 h-12 rounded-full bg-green-500 flex-center">
            <feather-icon name="upload" class="w-4 h-4 text-white" />
          </div>
        </div>
        <div class="mt-5 font-medium">{{ _('Existing File') }}</div>
        <div class="mt-2 text-sm text-gray-600 text-center">
          {{ _('Load an existing .db file from your computer.') }}
        </div>
      </div>
    </div>
    <p class="mt-4 flex-center text-sm text-gray-600">
      <feather-icon name="info" class="-ml-8 mr-1 w-4 h-4 inline" />
      <!-- prettier-ignore -->
      {{ _('This file will be used as a database to store data like Customers, Invoices and Settings.') }}
    </p>
  </div>
</template>
<script>
import {
  createNewDatabase,
  loadExistingDatabase,
  connectToLocalDatabase
} from '@/utils';

export default {
  name: 'DatabaseSelector',
  methods: {
    async newDatabase() {
      let filePath = await createNewDatabase();
      this.connectToDatabase(filePath);
    },
    async existingDatabase() {
      let filePath = await loadExistingDatabase();
      this.connectToDatabase(filePath);
    },
    async connectToDatabase(filePath) {
      await connectToLocalDatabase(filePath);
      this.$emit('database-connect');
    }
  }
};
</script>
