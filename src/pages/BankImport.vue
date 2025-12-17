<template>
  <div class="flex flex-col overflow-hidden w-full h-full bg-white dark:bg-gray-900">
    <PageHeader title="Bank Statement Importer" />

    <div class="flex-1 overflow-auto custom-scroll p-6 w-full max-w-5xl mx-auto">
      
      <!-- Status Bar -->
      <div v-if="statusMsg" 
           class="mb-6 p-4 rounded border shadow-sm"
           :class="isError ? 'bg-red-50 border-red-200 text-red-700' : 'bg-blue-50 border-blue-200 text-blue-700'">
        <p class="font-medium flex items-center gap-2">
          <span v-if="isError">⚠️</span>
          <span v-else>ℹ️</span>
          {{ statusMsg }}
        </p>
      </div>

      <!-- CARD 1: Select File -->
      <div class="mb-6 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-6 shadow-sm">
        <h2 class="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">1. Upload Statement</h2>
        <div class="flex flex-col gap-4">
          <div class="flex items-center gap-4">
            <label class="cursor-pointer bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded border dark:border-gray-600 transition-colors">
              <span>Choose File (QIF, OFX)</span>
              <input type="file" accept=".qif,.ofx" @change="handleFileSelect" class="hidden" />
            </label>
            <span v-if="fileName" class="font-semibold text-gray-700 dark:text-gray-300">{{ fileName }}</span>
            <span v-else class="text-gray-500 italic">No file selected</span>
          </div>
          
          <div v-if="parsedTransactions.length > 0" class="text-sm text-green-600 dark:text-green-400 font-medium bg-green-50 dark:bg-green-900/20 p-2 rounded w-fit">
            ✓ Successfully parsed {{ parsedTransactions.length }} transactions
          </div>
        </div>
      </div>

      <!-- CARD 2: Map Accounts -->
      <div class="mb-6 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-6 shadow-sm">
        <h2 class="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">2. Map Accounts</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <div>
            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Bank Account (Asset)</label>
            <select v-model="selectedBankAccount" class="w-full border p-2 rounded bg-white dark:bg-gray-900 dark:border-gray-600 dark:text-gray-200">
              <option value="" disabled>Select Bank Account...</option>
              <option v-for="acc in accounts" :key="acc" :value="acc">{{ acc }}</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Suspense Account</label>
            <select v-model="selectedSuspenseAccount" class="w-full border p-2 rounded bg-white dark:bg-gray-900 dark:border-gray-600 dark:text-gray-200">
              <option value="" disabled>Select Suspense Account...</option>
              <option v-for="acc in accounts" :key="acc" :value="acc">{{ acc }}</option>
            </select>
          </div>
        </div>
      </div>

      <div class="flex justify-end pt-4">
        <Button 
          @click="runImport" 
          :disabled="!canImport"
          type="primary"
          class="px-8 py-3 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
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
import { DateTime } from 'luxon';

interface BankTransaction {
  date: string; 
  amount: number;
  description: string;
}

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
      isImporting: false
    };
  },
  computed: {
    canImport(): boolean {
      return this.parsedTransactions.length > 0 && 
             !!this.selectedBankAccount && 
             !!this.selectedSuspenseAccount &&
             !this.isImporting;
    }
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
        this.statusMsg = "Error loading accounts.";
        this.isError = true;
      }
    },

    parseDate(dateStr: string): string | null {
      if (!dateStr) return null;
      const clean = dateStr.trim().replace(/^D/, '');
      const formats = ['d/M/yyyy', 'd/M/yy', 'yyyy-MM-dd', 'M/d/yyyy', 'yyyyMMdd'];
      
      for (const fmt of formats) {
        const dt = DateTime.fromFormat(clean, fmt);
        if (dt.isValid) return dt.toISODate();
      }
      return null;
    },

    async handleFileSelect(event: Event) {
      const target = event.target as HTMLInputElement;
      if (!target.files || !target.files[0]) return;

      const file = target.files[0];
      this.fileName = file.name;
      this.statusMsg = "Parsing file...";
      this.parsedTransactions = [];

      try {
        const text = await file.text();
        const ext = file.name.split('.').pop()?.toLowerCase();

        if (ext === 'qif') this.parseQIF(text);
        else if (ext === 'ofx') this.parseOFX(text);
        else {
          this.statusMsg = "Unsupported file format.";
          this.isError = true;
        }

        if (this.parsedTransactions.length > 0) {
           this.statusMsg = `Ready to import ${this.parsedTransactions.length} transactions.`;
           this.isError = false;
        }
      } catch (e) {
        console.error(e);
        this.statusMsg = "Failed to read file.";
      }
    },

    parseQIF(content: string) {
      const rawTxns = content.split('^');
      for (const raw of rawTxns) {
        const lines = raw.trim().split('\n');
        if (lines.length < 2) continue;
        
        let date = null;
        let amount = 0;
        const desc = [];

        for (let line of lines) {
          line = line.trim();
          if (!line) continue;
          const char = line[0].toUpperCase();
          const data = line.substring(1).trim();

          if (char === 'D') date = this.parseDate(data);
          else if (char === 'T') amount = parseFloat(data.replace(/,/g, ''));
          else if (['P', 'M', 'L'].includes(char)) desc.push(data);
        }

        if (date) {
          this.parsedTransactions.push({ date, amount, description: desc.join(' - ') });
        }
      }
    },

    parseOFX(content: string) {
      const blockMatch = content.match(/<BANKTRANLIST>([\s\S]*?)<\/BANKTRANLIST>/i);
      if (!blockMatch) return;

      const txRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;
      let match;
      while ((match = txRegex.exec(blockMatch[1])) !== null) {
        const inner = match[1];
        const dateM = inner.match(/<DTPOSTED>(\d{8})/i);
        const amtM = inner.match(/<TRNAMT>([-\d.]+)/i);
        const nameM = inner.match(/<NAME>(.*?)<\/NAME>/i);
        const memoM = inner.match(/<MEMO>(.*?)<\/MEMO>/i);

        if (dateM && amtM) {
           const desc = [];
           if (nameM) desc.push(nameM[1]);
           if (memoM) desc.push(memoM[1]);
           
           this.parsedTransactions.push({
             date: this.parseDate(dateM[1]) || '',
             amount: parseFloat(amtM[1]),
             description: desc.join(' - ')
           });
        }
      }
    },

    async runImport() {
      if (!confirm(`Import ${this.parsedTransactions.length} Journal Entries now?`)) return;
      
      this.isImporting = true;
      this.statusMsg = "Importing data...";
      let count = 0;

      try {
        const schemaName = 'JournalEntry';
        
        for (const tx of this.parsedTransactions) {
          if (!tx.amount || !tx.date) continue;

          let debitAcc = '';
          let creditAcc = '';
          let val = 0;

          if (tx.amount > 0) {
            debitAcc = this.selectedBankAccount;
            creditAcc = this.selectedSuspenseAccount;
            val = tx.amount;
          } else {
            debitAcc = this.selectedSuspenseAccount;
            creditAcc = this.selectedBankAccount;
            val = Math.abs(tx.amount);
          }

          // FIXED: Added 'entryType' and child table linkage fields
          const jeData = {
            doctype: schemaName,
            date: tx.date,
            entryType: 'Journal Entry', // <--- Missing mandatory field fixed
            voucherType: 'Journal Entry',
            title: tx.description.substring(0, 140),
            description: tx.description.substring(0, 140),
            accounts: [
              {
                doctype: 'JournalEntryAccount',
                parentfield: 'accounts',
                parenttype: schemaName,
                account: debitAcc,
                debit: val,
                credit: 0,
                description: tx.description.substring(0, 140)
              },
              {
                doctype: 'JournalEntryAccount',
                parentfield: 'accounts',
                parenttype: schemaName,
                account: creditAcc,
                debit: 0,
                credit: val,
                description: tx.description.substring(0, 140)
              }
            ]
          };

          const doc = fyo.doc.getNewDoc(schemaName, jeData, false);
          await doc.sync();
          await doc.submit();

          count++;
        }
        
        this.statusMsg = `Success! Created ${count} Journal Entries.`;
        this.parsedTransactions = [];
        this.fileName = '';
        
      } catch (e: any) {
        console.error(e);
        this.isError = true;
        this.statusMsg = `Import Error: ${e.message || e}`;
      } finally {
        this.isImporting = false;
      }
    }
  }
});
</script>