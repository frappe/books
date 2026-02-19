<template>
  <div
    class="
      flex flex-col
      overflow-hidden
      w-full
      h-full
      bg-white
      dark:bg-gray-900
    "
  >
    <PageHeader title="Bank Statement Importer" />

    <div
      class="flex-1 overflow-auto custom-scroll p-6 w-full max-w-5xl mx-auto"
    >
      <div
        v-if="statusMsg"
        class="mb-6 p-4 rounded border shadow-sm"
        :class="
          isError
            ? 'bg-red-50 border-red-200 text-red-700'
            : 'bg-blue-50 border-blue-200 text-blue-700'
        "
      >
        <p class="font-medium flex items-center gap-2">
          <span v-if="isError">⚠️</span>
          <span v-else>ℹ️</span>
          {{ statusMsg }}
        </p>
      </div>

      <div
        class="
          mb-6
          bg-white
          dark:bg-gray-800
          border
          dark:border-gray-700
          rounded-lg
          p-6
          shadow-sm
        "
      >
        <h2 class="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">
          1. Upload Statement
        </h2>
        <div class="flex flex-col gap-4">
          <div class="flex items-center gap-4">
            <label
              class="
                cursor-pointer
                bg-gray-100
                hover:bg-gray-200
                dark:bg-gray-700 dark:hover:bg-gray-600
                text-gray-700
                dark:text-gray-200
                px-4
                py-2
                rounded
                border
                dark:border-gray-600
                transition-colors
              "
            >
              <span>Choose File (QIF, OFX)</span>
              <input
                type="file"
                accept=".qif,.ofx"
                class="hidden"
                @change="handleFileSelect"
              />
            </label>
            <span
              v-if="fileName"
              class="font-semibold text-gray-700 dark:text-gray-300"
              >{{ fileName }}</span
            >
            <span v-else class="text-gray-500 italic">No file selected</span>
          </div>

          <div
            v-if="parsedTransactions.length > 0"
            class="
              text-sm text-green-600
              dark:text-green-400
              font-medium
              bg-green-50
              dark:bg-green-900/20
              p-2
              rounded
              w-fit
            "
          >
            ✓ Successfully parsed {{ parsedTransactions.length }} transactions
          </div>
        </div>
      </div>

      <div
        class="
          mb-6
          bg-white
          dark:bg-gray-800
          border
          dark:border-gray-700
          rounded-lg
          p-6
          shadow-sm
        "
      >
        <h2 class="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">
          2. Map Accounts
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label
              class="
                block
                text-sm
                font-semibold
                text-gray-700
                dark:text-gray-300
                mb-2
              "
              >Bank Account (Asset)</label
            >
            <select
              v-model="selectedBankAccount"
              class="
                w-full
                border
                p-2
                rounded
                bg-white
                dark:bg-gray-900 dark:border-gray-600 dark:text-gray-200
              "
            >
              <option value="" disabled>Select Bank Account...</option>
              <option v-for="acc in accounts" :key="acc" :value="acc">
                {{ acc }}
              </option>
            </select>
          </div>

          <div>
            <label
              class="
                block
                text-sm
                font-semibold
                text-gray-700
                dark:text-gray-300
                mb-2
              "
              >Suspense Account</label
            >
            <select
              v-model="selectedSuspenseAccount"
              class="
                w-full
                border
                p-2
                rounded
                bg-white
                dark:bg-gray-900 dark:border-gray-600 dark:text-gray-200
              "
            >
              <option value="" disabled>Select Suspense Account...</option>
              <option v-for="acc in accounts" :key="acc" :value="acc">
                {{ acc }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <div class="flex justify-end pt-4">
        <Button
          :disabled="!canImport"
          type="primary"
          class="
            px-8
            py-3
            font-bold
            text-white
            bg-blue-600
            hover:bg-blue-700
            rounded
            disabled:opacity-50 disabled:cursor-not-allowed
          "
          @click="runImport"
        >
          Import Data
        </Button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import PageHeader from 'src/components/PageHeader.vue';
import Button from 'src/components/Button.vue';
import { fyo } from 'src/initFyo';
import {
  parseQIF,
  parseOFX,
  BankTransaction,
} from 'src/utils/bankStatementParsers';
// This import was missing in your file, causing the ReferenceError:
import { importBankTransactions } from 'src/utils/bankImporter';

export default defineComponent({
  name: 'BankImport',
  components: { PageHeader, Button },
  data() {
    return {
      accounts: [] as string[],
      fileName: '',
      parsedTransactions: [] as BankTransaction[],
      selectedBankAccount: '',
      selectedSuspenseAccount: 'Suspense Clearing',
      statusMsg: '',
      isError: false,
      isImporting: false,
    };
  },
  computed: {
    canImport(): boolean {
      return (
        this.parsedTransactions.length > 0 &&
        !!this.selectedBankAccount &&
        !!this.selectedSuspenseAccount &&
        !this.isImporting
      );
    },
  },
  mounted() {
    this.loadAccounts();
  },
  methods: {
    async loadAccounts() {
      if (!fyo || !fyo.db) return;
      try {
        const result = await fyo.db.getAll('Account');
        this.accounts = result
          .filter((acc: any) => !acc.isGroup)
          .map((r: any) => r.name)
          .sort();
      } catch (e) {
        console.error(e);
        this.statusMsg = 'Error loading accounts.';
        this.isError = true;
      }
    },

    async handleFileSelect(event: Event) {
      const target = event.target as HTMLInputElement;
      if (!target.files || !target.files[0]) return;

      const file = target.files[0];
      this.fileName = file.name;
      this.statusMsg = 'Parsing file...';
      this.parsedTransactions = [];
      this.isError = false;

      try {
        const text = await file.text();
        const ext = file.name.split('.').pop()?.toLowerCase();

        if (ext === 'qif') {
          this.parsedTransactions = parseQIF(text);
        } else if (ext === 'ofx') {
          this.parsedTransactions = parseOFX(text);
        } else {
          this.statusMsg = 'Unsupported file format.';
          this.isError = true;
          return;
        }

        if (this.parsedTransactions.length > 0) {
          this.statusMsg = `Ready to import ${this.parsedTransactions.length} transactions.`;
        } else {
          this.statusMsg = 'No valid transactions found in file.';
          this.isError = true;
        }
      } catch (e) {
        console.error(e);
        this.statusMsg = 'Failed to read or parse file.';
        this.isError = true;
      }
    },

    async runImport() {
      if (
        !confirm(
          `Import ${this.parsedTransactions.length} Journal Entries now?`
        )
      )
        return;

      this.isImporting = true;
      this.statusMsg = 'Importing data...';

      try {
        const count = await importBankTransactions(
          fyo,
          this.parsedTransactions,
          this.selectedBankAccount,
          this.selectedSuspenseAccount
        );

        this.statusMsg = `Success! Created ${count} Draft Journal Entries.`;
        this.parsedTransactions = [];
        this.fileName = '';
        this.isError = false;
      } catch (e: any) {
        console.error(e);
        this.isError = true;
        this.statusMsg = `Import Error: ${e.message || e}`;
      } finally {
        this.isImporting = false;
      }
    },
  },
});
</script>
