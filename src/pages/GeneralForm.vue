<template>
  <FormContainer>
    <!-- Page Header (Title, Buttons, etc) -->
    <template #header v-if="doc">
      <StatusBadge :status="status" />
      <DropdownWithActions :actions="actions()" />
      <Button
        v-if="doc?.notInserted || doc?.dirty"
        type="primary"
        @click="sync"
      >
        {{ t`Save` }}
      </Button>
      <Button
        v-if="!doc?.dirty && !doc?.notInserted && !doc?.submitted"
        type="primary"
        @click="submit"
        >{{ t`Submit` }}</Button
      >
    </template>

    <!-- Form Header -->
    <template #body v-if="doc">
      <FormHeader
        :form-title="doc.notInserted ? t`New Entry` : doc.name"
        :form-sub-title="doc.schema?.label ?? ''"
      />
      <hr />

      <div>
        <!-- Invoice Form Data Entry -->
        <div class="m-4 grid grid-cols-3 gap-4">
          <FormControl
            input-class="font-semibold"
            :border="true"
            :df="getField('party')"
            :value="doc.party"
            @change="(value) => doc.set('party', value, true)"
            @new-doc="(party) => doc.set('party', party.name, true)"
            :read-only="doc?.submitted"
          />
          <FormControl
            input-class="text-right"
            :border="true"
            :df="getField('date')"
            :value="doc.date"
            @change="(value) => doc.set('date', value)"
            :read-only="doc?.submitted"
          />
          <FormControl
            input-class="text-right"
            :border="true"
            :df="getField('numberSeries')"
            :value="doc.numberSeries"
            @change="(value) => doc.set('numberSeries', value)"
            :read-only="!doc.notInserted || doc?.submitted"
          />
          <FormControl
            v-if="doc.attachment || !(doc.isSubmitted || doc.isCancelled)"
            :border="true"
            :df="getField('attachment')"
            :value="doc.attachment"
            @change="(value) => doc.set('attachment', value)"
            :read-only="doc?.submitted"
          />
        </div>
        <hr />

        <!-- Invoice Items Table -->
        <Table
          class="text-base"
          :df="getField('items')"
          :value="doc.items"
          :showHeader="true"
          :max-rows-before-overflow="4"
          @change="(value) => doc.set('items', value)"
          @editrow="toggleQuickEditDoc"
          :read-only="doc?.submitted"
        />
      </div>

      <!-- Invoice Form Footer -->

      <div v-if="doc.items?.length ?? 0" class="mt-auto">
        <hr />
        <div class="flex justify-between text-base m-4 gap-12">
          <div class="w-1/2 flex flex-col justify-between">
            <!-- Form Terms-->
            <FormControl
              :border="true"
              v-if="!doc?.submitted || doc.terms"
              :df="getField('terms')"
              :value="doc.terms"
              class="mt-auto"
              @change="(value) => doc.set('terms', value)"
              :read-only="doc?.submitted"
            />
          </div>
        </div>
      </div>
    </template>

    <template #quickedit v-if="quickEditDoc">
      <QuickEditForm
        class="w-quick-edit"
        :name="quickEditDoc.name"
        :show-name="false"
        :show-save="false"
        :source-doc="quickEditDoc"
        :source-fields="quickEditFields"
        :schema-name="quickEditDoc.schemaName"
        :white="true"
        :route-back="false"
        :load-on-close="false"
        @close="toggleQuickEditDoc(null)"
      />
    </template>
  </FormContainer>
</template>
<script>
import { computed } from '@vue/reactivity';
import { getDocStatus } from 'models/helpers';
import Button from 'src/components/Button.vue';
import FormControl from 'src/components/Controls/FormControl.vue';
import Table from 'src/components/Controls/Table.vue';
import DropdownWithActions from 'src/components/DropdownWithActions.vue';
import FormContainer from 'src/components/FormContainer.vue';
import FormHeader from 'src/components/FormHeader.vue';
import StatusBadge from 'src/components/StatusBadge.vue';
import { fyo } from 'src/initFyo';
import { docsPathMap } from 'src/utils/misc';
import {
  docsPath,
  getActionsForDocument,
  routeTo,
  showMessageDialog,
} from 'src/utils/ui';
import { nextTick } from 'vue';
import { handleErrorWithDialog } from '../errorHandling';
import QuickEditForm from './QuickEditForm.vue';

export default {
  name: 'InvoiceForm',
  props: { schemaName: String, name: String },
  components: {
    StatusBadge,
    Button,
    FormControl,
    DropdownWithActions,
    Table,
    FormContainer,
    QuickEditForm,
    FormHeader,
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
      chstatus: false,
      doc: null,
      quickEditDoc: null,
      quickEditFields: [],
      printSettings: null,
    };
  },
  updated() {
    this.chstatus = !this.chstatus;
  },
  computed: {
    status() {
      this.chstatus;
      return getDocStatus(this.doc);
    },
  },
  activated() {
    docsPath.value = docsPathMap[this.schemaName];
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

    let query = this.$route.query;
    if (query.values && query.schemaName === this.schemaName) {
      this.doc.set(this.$router.currentRoute.value.query.values);
    }

    if (fyo.store.isDevelopment) {
      window.frm = this;
    }
  },
  methods: {
    routeTo,
    async toggleQuickEditDoc(doc, fields = []) {
      if (this.quickEditDoc && doc) {
        this.quickEditDoc = null;
        this.quickEditFields = [];
        await nextTick();
      }

      this.quickEditDoc = doc;
      this.quickEditFields = fields;
    },
    actions() {
      return getActionsForDocument(this.doc);
    },
    getField(fieldname) {
      return fyo.getField(this.schemaName, fieldname);
    },
    async sync() {
      try {
        await this.doc.sync();
      } catch (err) {
        await this.handleError(err);
      }
    },
    async submit() {
      const message = t`Submit ${this.doc.name}`;
      const ref = this;
      await showMessageDialog({
        message,
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
    formattedValue(fieldname, doc) {
      if (!doc) {
        doc = this.doc;
      }

      const df = this.getField(fieldname);
      return fyo.format(doc[fieldname], df, doc);
    },
  },
};
</script>
