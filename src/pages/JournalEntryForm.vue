<template>
  <div class="flex flex-col">
    <!-- Page Header (Title, Buttons, etc) -->
    <PageHeader :backLink="true">
      <template v-if="doc">
        <StatusBadge :status="status" />
        <DropdownWithActions :actions="actions" />
        <Button
          v-if="doc?.notInserted || doc?.dirty"
          type="primary"
          class="text-white text-xs"
          @click="sync"
        >
          {{ t`Save` }}
        </Button>
        <Button
          v-else-if="!doc.dirty && !doc.notInserted && !doc.submitted"
          type="primary"
          class="text-white text-xs"
          @click="submit"
        >
          {{ t`Submit` }}
        </Button>
      </template>
    </PageHeader>

    <!-- Journal Entry Form -->
    <div v-if="doc" class="flex justify-center flex-1 mb-8 mt-2">
      <div
        class="
          border
          rounded-lg
          shadow
          h-full
          flex flex-col
          justify-between
          w-600
        "
      >
        <div>
          <div class="m-6 flex flex-col gap-2">
            <h1 class="text-2xl font-semibold">
              {{ doc.notInserted ? t`New Journal Entry` : doc.name }}
            </h1>

            <!-- First Column of Fields -->
            <div class="flex flex-row justify-between gap-2">
              <FormControl
                class="w-1/3"
                :df="getField('entryType')"
                :value="doc.entryType"
                placeholder="Entry Type"
                @change="(value) => doc.set('entryType', value)"
                input-class="bg-gray-100 px-3 py-2 text-base"
                :read-only="doc.submitted"
                :class="doc.submitted && 'pointer-events-none'"
              />
              <FormControl
                class="w-1/3"
                :df="getField('referenceNumber')"
                :value="doc.referenceNumber"
                :placeholder="'Reference Number'"
                @change="(value) => doc.set('referenceNumber', value)"
                input-class="bg-gray-100 p-2 text-base"
                :read-only="doc.submitted"
                :class="doc.submitted && 'pointer-events-none'"
              />
              <FormControl
                :df="getField('numberSeries')"
                :value="doc.numberSeries"
                @change="(value) => doc.set('numberSeries', value)"
                class="bg-gray-100 rounded w-1/3"
                input-class="p-2 text-base bg-transparent"
                :read-only="!doc.notInserted || doc.submitted"
                :class="doc.submitted && 'pointer-events-none'"
              />
            </div>

            <!-- Second Row of Fields -->
            <div class="flex flex-row justify-between gap-2">
              <FormControl
                class="w-1/3"
                :df="getField('date')"
                :value="doc.date"
                :placeholder="'Date'"
                @change="(value) => doc.set('date', value)"
                input-class="bg-gray-100 px-3 py-2 text-base"
                :read-only="doc.submitted"
                :class="doc.submitted && 'pointer-events-none'"
              />
              <div class="w-1/3" />
              <FormControl
                class="w-1/3"
                :df="getField('referenceDate')"
                :value="doc.referenceDate"
                :placeholder="'Reference Date'"
                @change="(value) => doc.set('referenceDate', value)"
                input-class="bg-gray-100 px-3 py-2 text-base"
                :read-only="doc.submitted"
                :class="doc.submitted && 'pointer-events-none'"
              />
            </div>
          </div>
          <hr />

          <!-- Account Entries Table -->
          <Table
            class="mt-2 px-6 text-base"
            :df="getField('accounts')"
            :value="doc.accounts"
            :showHeader="true"
            :max-rows-before-overflow="6"
            :read-only="doc.submitted"
          />
        </div>

        <!-- Footer -->
        <div v-if="doc.accounts?.length ?? 0">
          <hr />
          <div class="flex justify-between text-base m-6 gap-12">
            <!-- User Remark -->
            <FormControl
              v-if="!doc.submitted || doc.userRemark"
              class="w-1/2 self-end"
              input-class="bg-gray-100"
              :df="getField('userRemark')"
              :value="doc.userRemark"
              @change="(value) => doc.set('userRemark', value)"
              :class="doc.submitted && 'pointer-events-none'"
              :read-only="doc.submitted"
            />

            <!-- Debit and Credit -->
            <div
              class="w-1/2 gap-2 flex flex-col self-end font-semibold ml-auto"
            >
              <div class="flex justify-between text-green-600">
                <div>{{ t`Total Debit` }}</div>
                <div>{{ totalDebit }}</div>
              </div>
              <hr />
              <div class="flex justify-between text-red-600">
                <div>{{ t`Total Credit` }}</div>
                <div>{{ totalCredit }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import { computed } from '@vue/reactivity';
import { ModelNameEnum } from 'models/types';
import Button from 'src/components/Button';
import FormControl from 'src/components/Controls/FormControl.vue';
import Table from 'src/components/Controls/Table.vue';
import DropdownWithActions from 'src/components/DropdownWithActions';
import PageHeader from 'src/components/PageHeader';
import StatusBadge from 'src/components/StatusBadge';
import { fyo } from 'src/initFyo';
import {
getActionsForDocument,
routeTo,
showMessageDialog
} from 'src/utils/ui';
import { handleErrorWithDialog } from '../errorHandling';

export default {
  name: 'JournalEntryForm',
  props: ['name'],
  components: {
    PageHeader,
    Button,
    DropdownWithActions,
    StatusBadge,
    FormControl,
    Table,
  },
  provide() {
    return {
      schemaName: this.schemaName,
      name: this.name,
      doc: computed(() => this.doc),
    };
  },
  data() {
    return {
      schemaName: ModelNameEnum.JournalEntry,
      doc: null,
    };
  },
  async mounted() {
    try {
      this.doc = await fyo.doc.getDoc(this.schemaName, this.name);
    } catch (error) {
      if (error instanceof fyo.errors.NotFoundError) {
        routeTo(`/list/${this.schemaName}`);
        return;
      }

      this.handleError(error);
    }

    if (fyo.store.isDevelopment) {
      window.je = this;
    }
  },
  computed: {
    status() {
      if (this.doc.notInserted || !this.doc.submitted) {
        return 'Draft';
      }

      return '';
    },
    totalDebit() {
      let value = 0;
      if (this.doc.accounts) {
        value = this.doc.getSum('accounts', 'debit');
      }
      return fyo.format(value, 'Currency');
    },
    totalCredit() {
      let value = 0;
      if (this.doc.accounts) {
        value = this.doc.getSum('accounts', 'credit');
      }
      return fyo.format(value, 'Currency');
    },
    actions() {
      return getActionsForDocument(this.doc);
    },
  },
  methods: {
    getField(fieldname) {
      return fyo.getField(ModelNameEnum.JournalEntry, fieldname);
    },
    async sync() {
      return this.doc.sync().catch(this.handleError);
    },
    async submit() {
      showMessageDialog({
        message: this.t`Submit Journal Entry?`,
        buttons: [
          {
            label: this.t`Yes`,
            action: () => {
              this.doc.submit().catch(this.handleError);
            },
          },
          {
            label: this.t`No`,
            action() {},
          },
        ],
      });
    },
    handleError(e) {
      handleErrorWithDialog(e, this.doc);
    },
  },
};
</script>
