<template>
  <FormContainer>
    <!-- Page Header (Title, Buttons, etc) -->
    <template #header v-if="doc">
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

    <!-- Journal Entry Form -->
    <template #body v-if="doc">
      <div
        class="
          px-4
          text-xl
          font-semibold
          flex
          justify-between
          h-row-large
          items-center
        "
      >
        <h1>
          {{ doc.notInserted ? t`New Entry` : doc.name }}
        </h1>
        <p class="text-gray-600">
          {{ t`Journal Entry` }}
        </p>
      </div>
      <hr />
      <div>
        <div class="m-4 grid grid-cols-3 gap-y-4 gap-x-4">
          <!-- First Column of Fields -->
          <FormControl
            :df="getField('numberSeries')"
            :value="doc.numberSeries"
            @change="(value) => doc.set('numberSeries', value)"
            class="bg-gray-100 rounded"
            input-class="p-2 text-base bg-transparent"
            :read-only="!doc.notInserted || doc.submitted"
          />
          <FormControl
            :df="getField('date')"
            :value="doc.date"
            :placeholder="'Date'"
            @change="(value) => doc.set('date', value)"
            input-class="bg-gray-100 px-3 py-2 text-base"
            :read-only="doc.submitted"
          />
          <FormControl
            :df="getField('entryType')"
            :value="doc.entryType"
            placeholder="Entry Type"
            @change="(value) => doc.set('entryType', value)"
            input-class="bg-gray-100 px-3 py-2 text-base"
            :read-only="doc.submitted"
          />
          <FormControl
            :df="getField('referenceNumber')"
            :value="doc.referenceNumber"
            :placeholder="'Reference Number'"
            @change="(value) => doc.set('referenceNumber', value)"
            input-class="bg-gray-100 p-2 text-base"
            :read-only="doc.submitted"
          />
          <FormControl
            :df="getField('referenceDate')"
            :value="doc.referenceDate"
            :placeholder="'Reference Date'"
            @change="(value) => doc.set('referenceDate', value)"
            input-class="bg-gray-100 px-3 py-2 text-base"
            :read-only="doc.submitted"
          />
        </div>
        <hr />

        <!-- Account Entries Table -->
        <Table
          class="text-base"
          :df="getField('accounts')"
          :value="doc.accounts"
          :showHeader="true"
          :max-rows-before-overflow="6"
          :read-only="doc.submitted"
        />
      </div>

      <!-- Footer -->
      <div v-if="doc.accounts?.length ?? 0" class="mt-auto">
        <hr />
        <div class="flex justify-between text-base m-4 gap-12">
          <!-- User Remark -->
          <FormControl
            v-if="!doc.submitted || doc.userRemark"
            class="w-1/2 self-end"
            input-class="bg-gray-100"
            :df="getField('userRemark')"
            :value="doc.userRemark"
            @change="(value) => doc.set('userRemark', value)"
            :read-only="doc.submitted"
          />

          <!-- Debit and Credit -->
          <div class="w-1/2 gap-2 flex flex-col self-end font-semibold ml-auto">
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
    </template>
  </FormContainer>
</template>
<script>
import { computed } from '@vue/reactivity';
import { getDocStatus } from 'models/helpers';
import { ModelNameEnum } from 'models/types';
import Button from 'src/components/Button.vue';
import FormControl from 'src/components/Controls/FormControl.vue';
import Table from 'src/components/Controls/Table.vue';
import DropdownWithActions from 'src/components/DropdownWithActions.vue';
import FormContainer from 'src/components/FormContainer.vue';
import StatusBadge from 'src/components/StatusBadge.vue';
import { fyo } from 'src/initFyo';
import { docsPathMap } from 'src/utils/misc';
import {
docsPath,
getActionsForDocument,
routeTo,
showMessageDialog
} from 'src/utils/ui';
import { handleErrorWithDialog } from '../errorHandling';

export default {
  name: 'JournalEntryForm',
  props: ['name'],
  components: {
    Button,
    DropdownWithActions,
    StatusBadge,
    FormControl,
    Table,
    FormContainer,
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
  activated() {
    docsPath.value = docsPathMap.JournalEntry;
  },
  deactivated() {
    docsPath.value = '';
  },
  async mounted() {
    try {
      this.doc = await fyo.doc.getDoc(this.schemaName, this.name);
    } catch (error) {
      if (error instanceof fyo.errors.NotFoundError) {
        routeTo(`/list/${this.schemaName}`);
        return;
      }

      await this.handleError(error);
    }

    if (fyo.store.isDevelopment) {
      window.je = this;
    }
  },
  computed: {
    status() {
      return getDocStatus(this.doc);
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
      try {
        await this.doc.sync();
      } catch (err) {
        this.handleError(err);
      }
    },
    async submit() {
      const ref = this;
      await showMessageDialog({
        message: this.t`Submit Journal Entry?`,
        buttons: [
          {
            label: this.t`Yes`,
            async action() {
              try {
                await ref.doc.submit();
              } catch (err) {
                await ref.handleError(err);
              }
            },
          },
          {
            label: this.t`No`,
            action() {},
          },
        ],
      });
    },
    async handleError(e) {
      await handleErrorWithDialog(e, this.doc);
    },
  },
};
</script>
