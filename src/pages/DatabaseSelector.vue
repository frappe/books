<template>
  <div class="px-12 py-10 flex-1 bg-white">
    <h1 class="text-2xl font-semibold">{{ _('Welcome to Frappe Accounting') }}</h1>
    <p
      class="text-gray-600"
    >{{ _('Do you need to create a new database or load an existing one?') }}</p>
    <div class="flex mt-10">
      <div
        @click="newDatabase"
        class="w-1/2 border rounded-12px flex flex-col items-center py-8 px-5 cursor-pointer hover:shadow"
      >
        <div class="w-14 h-14 rounded-full bg-blue-200 relative flex items-center justify-center">
          <div class="w-12 h-12 absolute rounded-full bg-blue-500 flex items-center justify-center">
            <AddIcon class="w-4 h-4 text-white stroke-current" />
          </div>
        </div>
        <div class="mt-5 font-medium">{{ _('New Database') }}</div>
        <div
          class="mt-2 text-sm text-gray-600 text-center"
        >{{ _('Create a new database file and store it in your computer.') }}</div>
      </div>
      <div
        @click="existingDatabase"
        class="ml-6 w-1/2 border rounded-12px flex flex-col items-center py-8 px-5 cursor-pointer hover:shadow"
      >
        <div class="w-14 h-14 rounded-full bg-green-200 relative flex items-center justify-center">
          <div class="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
            <svg
              class="w-4 h-4 stroke-current text-white"
              viewBox="0 0 21 19"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M10.664 9.824V1.42m6.723.84h2.52v11.765H1.42V2.261h2.521m2.521 15.966h8.404m-4.202-4.202v4.202M7.303 4.782l3.36-3.362 3.362 3.362"
                stroke="#FFF"
                stroke-width="1.5"
                fill="none"
                fill-rule="evenodd"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
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
import AddIcon from '@/components/Icons/Add';
import { createNewDatabase, loadExistingDatabase } from '@/utils';

export default {
  name: 'DatabaseSelector',
  components: {
    AddIcon
  },
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
