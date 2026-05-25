<template>
  <div class="flex flex-col overflow-hidden w-full h-full">
    <PageHeader :title="t`LHV Bank Statement Import`">
      <Button v-if="rows.length > 0" :title="t`Clear`" @click="clear">
        {{ t`Clear` }}
      </Button>
      <Button
        v-if="rows.length === 0"
        type="primary"
        :title="t`Select Statement File`"
        @click="selectFile"
      >
        {{ t`Select File` }}
      </Button>
      <Button
        v-if="rows.length > 0 && !isCommitting && commitResult === null"
        type="primary"
        :title="t`Create Journal Entries`"
        @click="commit"
      >
        {{ t`Create ${rows.length} Entries` }}
      </Button>
    </PageHeader>

    <div class="px-6 py-4 overflow-y-auto flex-1">
      <!-- Empty state -->
      <div
        v-if="rows.length === 0 && commitResult === null"
        class="text-base text-gray-600 max-w-2xl"
      >
        <p class="mb-2">
          {{
            t`Import an LHV CSV (valid-from-25.02.2026 format, 16 columns) or CAMT.053.001.02 XML statement.`
          }}
        </p>
        <p class="mb-2">
          {{
            t`Rows are matched against built-in rules (AWS, GitHub, Stripe, Apple/Google payouts, LHV fees). You can override the proposed account and VAT code before committing.`
          }}
        </p>
        <p>
          {{
            t`Duplicate detection uses the LHV archival ID, so re-importing the same statement is safe.`
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
          >
            <td class="px-2 py-1.5 font-mono">{{ row.date }}</td>
            <td class="px-2 py-1.5">{{ row.counterpartyName ?? '—' }}</td>
            <td
              class="px-2 py-1.5 text-right font-mono"
              :class="row.amount < 0 ? 'text-red-700' : 'text-green-700'"
            >
              {{ formatAmount(row.amount) }}
            </td>
            <td class="px-2 py-1.5">
              <input
                v-model="rows[idx].proposedAccount"
                class="border border-gray-300 rounded px-1 py-0.5 w-44"
              />
            </td>
            <td class="px-2 py-1.5">
              <select
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
import {
  parseLhvCsv,
  parseLhvCamt,
  classifyRows,
  buildJournalEntries,
  ClassifiedRow,
} from 'src/regional/ee/lhvImporter';
import type { BuildResult } from 'src/regional/ee/lhvImporter/journalEntryBuilder';

export default defineComponent({
  components: { Button, PageHeader },
  data() {
    return {
      rows: [] as ClassifiedRow[],
      parseError: '' as string,
      isCommitting: false,
      commitResult: null as BuildResult | null,
    };
  },
  computed: {
    vatCodeOptions(): VatCodeName[] {
      return Object.keys(VAT_CODES) as VatCodeName[];
    },
  },
  methods: {
    async selectFile() {
      this.parseError = '';
      const res = await ipc.getOpenFilePath({
        title: this.t`Select LHV statement file`,
        properties: ['openFile'],
        filters: [{ name: 'LHV statement', extensions: ['csv', 'xml'] }],
      });
      if (res.canceled || !res.filePath || !res.data) return;

      const text = bufferToString(res.data);
      const ext = res.filePath.toLowerCase().split('.').pop() ?? '';

      try {
        const parsed = ext === 'xml' ? parseLhvCamt(text) : parseLhvCsv(text);
        this.rows = classifyRows(parsed);
        if (this.rows.length === 0) {
          this.parseError = this.t`No rows found in file.`;
        }
      } catch (err) {
        this.parseError = (err as Error).message ?? String(err);
      }
    },
    async commit() {
      this.isCommitting = true;
      try {
        this.commitResult = await buildJournalEntries(this.rows, fyo);
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
  // Buffer serialized as { type: 'Buffer', data: number[] }
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
