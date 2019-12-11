<template>
  <div class="px-12 py-10 flex-1 bg-white window-drag">
    <h1 class="text-2xl font-semibold">{{ _('Welcome to Frappe Accounting') }}</h1>
    <p
      class="text-gray-600"
    >{{ _('Do you need to create a new database or load an existing one?') }}</p>
    <div class="flex mt-10">
      <div
        @click="newDatabase"
        class="w-1/2 border rounded-xl flex flex-col items-center py-8 px-5 cursor-pointer hover:shadow"
      >
        <div class="w-14 h-14 rounded-full bg-blue-200 relative flex-center">
          <div class="w-12 h-12 absolute rounded-full bg-blue-500 flex-center">
            <feather-icon name="plus" class="text-white w-5 h-5"/>
          </div>
        </div>
        <div class="mt-5 font-medium">{{ _('New Database') }}</div>
        <div
          class="mt-2 text-sm text-gray-600 text-center"
        >{{ _('Create a new database file and store it in your computer.') }}</div>
      </div>
      <div
        @click="existingDatabase"
        class="ml-6 w-1/2 border rounded-xl flex flex-col items-center py-8 px-5 cursor-pointer hover:shadow"
      >
        <div class="w-14 h-14 rounded-full bg-green-200 relative flex-center">
          <div class="w-12 h-12 rounded-full bg-green-500 flex-center">
            <feather-icon name="upload"  class="w-4 h-4 text-white" />
          </div>
        </div>
        <div class="mt-5 font-medium">{{ _('Existing Database') }}</div>
        <div
          class="mt-2 text-sm text-gray-600 text-center"
        >{{ _('Load an existing .db file from your computer.') }}</div>
      </div>
    </div>
  </div>
</template>
<script>
import { _ } from 'frappejs';
import { createNewDatabase, loadExistingDatabase } from '@/utils';

export default {
  name: 'DatabaseSelector',
  methods: {
    async newDatabase() {
      let filePath = await createNewDatabase();
      this.$emit('file', filePath);
    },
    async existingDatabase() {
      let filePath = await loadExistingDatabase();
      this.$emit('file', filePath);
    }
  }
};
</script>
