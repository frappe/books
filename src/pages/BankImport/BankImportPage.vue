<template>
  <div class="flex flex-col overflow-hidden w-full h-full">
    <PageHeader :title="t`EE Bank Statement Import`">
      <template v-if="rows.length === 0 && commitResult === null">
        <select
          v-model="selectedBankId"
          class="border border-gray-300 rounded px-2 py-1 text-sm"
        >
          <option v-for="bank in EE_BANKS" :key="bank.id" :value="bank.id">
            {{ bank.label }}
          </option>
        </select>
        <select
          v-model="selectedBankAccount"
          class="border border-gray-300 rounded px-2 py-1 text-sm"
        >
          <option v-for="a in bankAccountOptions" :key="a" :value="a">
            {{ a }}
          </option>
        </select>
      </template>
      <span v-else class="text-sm text-gray-500">
        {{ selectedBank?.label }} · {{ selectedBankAccount }}
      </span>

      <Button v-if="rows.length > 0" :title="t`Clear`" @click="clear">
        {{ t`Clear` }}
      </Button>
      <Button
        v-if="rows.length === 0 && commitResult === null"
        type="primary"
        :title="t`Select Statement File`"
        @click="selectFile"
      >
        {{ t`Select File` }}
      </Button>
      <label
        v-if="nonDuplicateCount > 0 && !isCommitting && commitResult === null"
        class="flex items-center gap-1.5 text-sm text-gray-600"
        :title="t`When off, entries are created as drafts so you can review and attach invoices before submitting.`"
      >
        <input v-model="autoSubmit" type="checkbox" />
        {{ t`Auto-submit` }}
      </label>
      <Button
        v-if="nonDuplicateCount > 0 && !isCommitting && commitResult === null"
        type="primary"
        :title="t`Create Journal Entries`"
        @click="commit"
      >
        {{ t`Create ${nonDuplicateCount} Entries` }}
      </Button>
      <Button
        v-if="
          commitResult &&
          !commitResult.autoSubmitted &&
          commitResult.draftNames.length > 0 &&
          !isCommitting
        "
        type="primary"
        :title="t`Submit Drafts`"
        @click="submitDrafts"
      >
        {{ t`Submit ${commitResult.draftNames.length} Drafts` }}
      </Button>
    </PageHeader>

    <div class="px-6 py-4 overflow-y-auto flex-1">
      <!-- Empty state -->
      <div
        v-if="rows.length === 0 && commitResult === null"
        class="text-base text-gray-600 max-w-2xl"
      >
        <p class="mb-2">{{ emptyStateDescription }}</p>
        <p class="mb-2">
          {{
            t`Rows are matched against built-in rules (AWS, GitHub, Stripe, Apple/Google payouts, LHV fees). You can override the proposed account and VAT code before committing.`
          }}
        </p>
        <p>
          {{
            t`Duplicate detection uses the archival ID, so re-importing the same statement is safe.`
          }}
        </p>
      </div>

      <!-- Error display -->
      <div
        v-if="parseError"
        class="bg-red-50 border border-red-300 text-red-700 rounded p-3 mb-4"
      >
        {{ parseError }}
      </div>

      <!-- Commit summary -->
      <div
        v-if="commitResult"
        class="bg-green-50 border border-green-300 rounded p-4 mb-4"
      >
        <div class="font-semibold text-green-800 mb-1">
          {{ t`Import complete` }}
        </div>
        <ul class="text-sm text-green-900 list-disc list-inside">
          <li>{{ t`${commitResult.bankEntries} bank entries created` }}</li>
          <li v-if="!commitResult.autoSubmitted">
            {{
              t`Created as drafts — review and attach invoices, then submit.`
            }}
          </li>
          <li>
            {{
              t`${commitResult.reverseChargeEntries} reverse-charge entries created`
            }}
          </li>
          <li v-if="commitResult.duplicatesSkipped.length > 0">
            {{ t`${commitResult.duplicatesSkipped.length} duplicates skipped` }}
          </li>
          <li v-if="commitResult.errors.length > 0" class="text-red-700">
            {{ t`${commitResult.errors.length} errors — see console` }}
          </li>
        </ul>
      </div>

      <!-- Rows table -->
      <table v-if="rows.length > 0" class="w-full text-sm border-collapse">
        <thead class="bg-gray-50 text-gray-600 text-xs uppercase tracking-wide">
          <tr>
            <th class="text-left px-2 py-1.5">{{ t`Date` }}</th>
            <th class="text-left px-2 py-1.5">{{ t`Counterparty` }}</th>
            <th class="text-right px-2 py-1.5">{{ t`Amount` }}</th>
            <th class="text-left px-2 py-1.5">{{ t`Account` }}</th>
            <th class="text-left px-2 py-1.5">{{ t`VAT` }}</th>
            <th class="text-left px-2 py-1.5">{{ t`Remittance` }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, idx) in rows"
            :key="row.archivalId"
            class="border-t border-gray-200"
            :class="row.isDuplicate ? 'opacity-40 bg-gray-50' : ''"
          >
            <td class="px-2 py-1.5 font-mono">
              {{ row.date }}
              <span
                v-if="row.isDuplicate"
                class="ml-1 text-xs text-gray-400 italic"
              >dup</span>
            </td>
            <td class="px-2 py-1.5">{{ row.counterpartyName ?? '—' }}</td>
            <td
              class="px-2 py-1.5 text-right font-mono"
              :class="row.amount < 0 ? 'text-red-700' : 'text-green-700'"
            >
              {{ formatAmount(row.amount) }}
            </td>
            <td class="px-2 py-1.5">
              <select
                v-if="!row.isDuplicate"
                v-model="rows[idx].proposedAccount"
                class="border border-gray-300 rounded px-1 py-0.5"
              >
                <option v-for="a in accountOptions" :key="a" :value="a">
                  {{ a }}
                </option>
              </select>
              <span v-else class="text-gray-400 text-xs">{{ row.proposedAccount }}</span>
            </td>
            <td class="px-2 py-1.5">
              <select
                v-if="!row.isDuplicate"
                v-model="rows[idx].proposedVatCode"
                class="border border-gray-300 rounded px-1 py-0.5"
              >
                <option :value="null">—</option>
                <option
                  v-for="code in vatCodeOptions"
                  :key="code"
                  :value="code"
                >
                  {{ code }}
                </option>
              </select>
              <span v-else class="text-gray-400 text-xs">{{ row.proposedVatCode ?? '—' }}</span>
            </td>
            <td class="px-2 py-1.5 text-gray-500 max-w-xs truncate">
              {{ row.remittance ?? '' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import Button from 'src/components/Button.vue';
import PageHeader from 'src/components/PageHeader.vue';
import { fyo } from 'src/initFyo';
import { VAT_CODES, VatCodeName } from 'regional/ee';
import { ModelNameEnum } from 'models/types';
import {
  parseLhvCsv,
  parseCamt,
  classifyRows,
  buildJournalEntries,
  ClassifiedRow,
  EeBank,
  EE_BANKS,
} from 'src/regional/ee/bankImporter';
import type { BuildResult } from 'src/regional/ee/bankImporter/journalEntryBuilder';

const CSV_PARSERS: Partial<Record<string, (text: string) => ReturnType<typeof parseLhvCsv>>> = {
  lhv: parseLhvCsv,
};

export default defineComponent({
  components: { Button, PageHeader },
  data() {
    return {
      selectedBankId: 'lhv' as string,
      selectedBankAccount: '' as string,
      rows: [] as ClassifiedRow[],
      parseError: '' as string,
      isCommitting: false,
      autoSubmit: true,
      commitResult: null as BuildResult | null,
      accountOptions: [] as string[],
      bankAccountOptions: [] as string[],
      EE_BANKS,
    };
  },
  async mounted() {
    const all = await fyo.db.getAll('Account', {
      fields: ['name', 'accountType'],
      filters: { isGroup: false },
      orderBy: 'name',
    }) as { name: string; accountType?: string }[];

    this.accountOptions = all.map((a) => a.name);
    this.bankAccountOptions = all
      .filter((a) => a.accountType === 'Bank' || a.accountType === 'Cash')
      .map((a) => a.name);

    if (this.bankAccountOptions.length > 0) {
      this.selectedBankAccount = this.bankAccountOptions[0];
    }
  },
  computed: {
    selectedBank(): EeBank | undefined {
      return EE_BANKS.find((b) => b.id === this.selectedBankId);
    },
    vatCodeOptions(): VatCodeName[] {
      return Object.keys(VAT_CODES) as VatCodeName[];
    },
    nonDuplicateCount(): number {
      return this.rows.filter((r) => !r.isDuplicate).length;
    },
    emptyStateDescription(): string {
      const bank = this.selectedBank;
      if (!bank) return this.t`Select a bank and import a CAMT.053 XML statement.`;
      if (bank.csvSupported) {
        return this.t`Import a ${bank.label} CSV or CAMT.053.001.02 XML statement.`;
      }
      return this.t`Import a CAMT.053.001.02 XML statement exported from ${bank.label}. CSV is not yet supported for this bank.`;
    },
  },
  methods: {
    async selectFile() {
      this.parseError = '';
      const bank = this.selectedBank;
      const extensions = bank?.csvSupported ? ['csv', 'xml'] : ['xml'];

      const res = await ipc.selectFile({
        title: this.t`Select bank statement file`,
        filters: [{ name: 'Bank statement', extensions }],
      });
      if (res.canceled || !res.success || !res.filePath || !res.data) return;

      const text = bufferToString(res.data);
      const ext = res.filePath.toLowerCase().split('.').pop() ?? '';

      try {
        let parsed;
        if (ext === 'xml') {
          parsed = parseCamt(text);
        } else {
          const csvParser = CSV_PARSERS[this.selectedBankId];
          if (!csvParser) {
            this.parseError = this.t`CSV import is not yet supported for ${bank?.label ?? this.selectedBankId}. Export a CAMT.053 XML statement instead.`;
            return;
          }
          parsed = csvParser(text);
        }

        this.rows = classifyRows(parsed);
        if (this.rows.length === 0) {
          this.parseError = this.t`No rows found in file.`;
        } else {
          await this.markDuplicates();
        }
      } catch (err) {
        this.parseError = (err as Error).message ?? String(err);
      }
    },
    async markDuplicates() {
      for (const row of this.rows) {
        const existing = (await fyo.db.getAll(ModelNameEnum.JournalEntry, {
          fields: ['name'],
          filters: { lhvArchivalId: row.archivalId, cancelled: false },
          limit: 1,
        })) as { name: string }[];
        row.isDuplicate = existing.length > 0;
      }
    },
    async commit() {
      this.isCommitting = true;
      try {
        this.commitResult = await buildJournalEntries(
          this.rows,
          fyo,
          this.selectedBankAccount,
          { autoSubmit: this.autoSubmit }
        );
      } catch (err) {
        this.parseError = (err as Error).message ?? String(err);
      } finally {
        this.isCommitting = false;
      }
    },
    async submitDrafts() {
      if (!this.commitResult) return;
      this.isCommitting = true;
      try {
        for (const name of this.commitResult.draftNames) {
          const doc = await fyo.doc.getDoc(ModelNameEnum.JournalEntry, name);
          if (!doc.submitted && !doc.cancelled) {
            await doc.submit();
          }
        }
        this.commitResult.autoSubmitted = true;
        this.commitResult.draftNames = [];
      } catch (err) {
        this.parseError = (err as Error).message ?? String(err);
      } finally {
        this.isCommitting = false;
      }
    },
    clear() {
      this.rows = [];
      this.commitResult = null;
      this.parseError = '';
    },
    formatAmount(n: number): string {
      return n.toFixed(2);
    },
  },
});

function bufferToString(data: unknown): string {
  if (typeof data === 'string') return data;
  if (data instanceof Uint8Array) {
    return new TextDecoder('utf-8').decode(data);
  }
  if (
    data &&
    typeof data === 'object' &&
    'data' in (data as Record<string, unknown>) &&
    Array.isArray((data as { data: unknown }).data)
  ) {
    return new TextDecoder('utf-8').decode(
      Uint8Array.from((data as { data: number[] }).data)
    );
  }
  return String(data);
}
</script>
