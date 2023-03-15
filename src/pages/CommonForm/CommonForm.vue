<template>
  <FormContainer>
    <template #header-left v-if="hasDoc">
      <StatusBadge :status="status" class="h-8" />
    </template>
    <template #header v-if="hasDoc">
      <Button
        v-if="!doc.isCancelled && !doc.dirty && isPrintable"
        :icon="true"
        @click="routeTo(`/print/${doc.schemaName}/${doc.name}`)"
      >
        {{ t`Print` }}
      </Button>
      <DropdownWithActions
        v-for="group of groupedActions"
        :key="group.label"
        :type="group.type"
        :actions="group.actions"
      >
        <p v-if="group.group">
          {{ group.group }}
        </p>
        <feather-icon v-else name="more-horizontal" class="w-4 h-4" />
      </DropdownWithActions>
      <Button v-if="doc?.canSave" type="primary" @click="sync">
        {{ t`Save` }}
      </Button>
      <Button v-else-if="doc?.canSubmit" type="primary" @click="submit">{{
        t`Submit`
      }}</Button>
    </template>
    <template #body>
      <FormHeader
        :form-title="title"
        :form-sub-title="schema.label"
        class="sticky top-0 bg-white border-b"
      >
      </FormHeader>

      <!-- Section Container -->
      <div v-if="hasDoc" class="overflow-auto custom-scroll">
        <CommonFormSection
          v-for="([name, fields], idx) in activeGroup.entries()"
          @editrow="(doc: Doc) => toggleQuickEditDoc(doc)"
          :key="name + idx"
          ref="section"
          class="p-4"
          :class="idx !== 0 && activeGroup.size > 1 ? 'border-t' : ''"
          :show-title="activeGroup.size > 1 && name !== t`Default`"
          :title="name"
          :fields="fields"
          :doc="doc"
          :errors="errors"
          @value-change="onValueChange"
        />
      </div>

      <!-- Tab Bar -->
      <div
        class="
          mt-auto
          px-4
          pb-4
          flex
          gap-8
          border-t
          flex-shrink-0
          sticky
          bottom-0
          bg-white
        "
        v-if="groupedFields && groupedFields.size > 1"
      >
        <div
          v-for="key of groupedFields.keys()"
          :key="key"
          @click="activeTab = key"
          class="text-sm cursor-pointer"
          :class="
            key === activeTab
              ? 'text-blue-500 font-semibold border-t-2 border-blue-500'
              : ''
          "
          :style="{
            paddingTop: key === activeTab ? 'calc(1rem - 2px)' : '1rem',
          }"
        >
          {{ key }}
        </div>
      </div>
    </template>
    <template #quickedit>
      <Transition name="quickedit">
        <QuickEditForm
          v-if="hasQeDoc"
          :name="qeDoc.name"
          :show-name="false"
          :show-save="false"
          :source-doc="qeDoc"
          :schema-name="qeDoc.schemaName"
          :white="true"
          :route-back="false"
          :load-on-close="false"
          @close="() => toggleQuickEditDoc(null)"
        />
      </Transition>
    </template>
  </FormContainer>
</template>
<script lang="ts">
import { DocValue } from 'fyo/core/types';
import { Doc } from 'fyo/model/doc';
import { ValidationError } from 'fyo/utils/errors';
import { getDocStatus } from 'models/helpers';
import { ModelNameEnum } from 'models/types';
import { Field, Schema } from 'schemas/types';
import Button from 'src/components/Button.vue';
import DropdownWithActions from 'src/components/DropdownWithActions.vue';
import FormContainer from 'src/components/FormContainer.vue';
import FormHeader from 'src/components/FormHeader.vue';
import StatusBadge from 'src/components/StatusBadge.vue';
import { handleErrorWithDialog } from 'src/errorHandling';
import { getErrorMessage } from 'src/utils';
import { docsPathMap } from 'src/utils/misc';
import { docsPathRef, focusedDocsRef } from 'src/utils/refs';
import { ActionGroup, UIGroupedFields } from 'src/utils/types';
import {
  commonDocSubmit,
  commonDocSync,
  getDocFromNameIfExistsElseNew,
  getFieldsGroupedByTabAndSection,
  getGroupedActionsForDoc,
  isPrintable,
  routeTo,
} from 'src/utils/ui';
import { computed, defineComponent, nextTick } from 'vue';
import QuickEditForm from '../QuickEditForm.vue';
import CommonFormSection from './CommonFormSection.vue';

export default defineComponent({
  props: {
    name: { type: String, default: '' },
    schemaName: { type: String, default: ModelNameEnum.SalesInvoice },
  },
  provide() {
    return {
      schemaName: computed(() => this.docOrNull?.schemaName),
      name: computed(() => this.docOrNull?.name),
      doc: computed(() => this.docOrNull),
    };
  },
  data() {
    return {
      errors: {},
      docOrNull: null,
      activeTab: this.t`Default`,
      groupedFields: null,
      quickEditDoc: null,
      isPrintable: false,
    } as {
      errors: Record<string, string>;
      docOrNull: null | Doc;
      activeTab: string;
      groupedFields: null | UIGroupedFields;
      quickEditDoc: null | Doc;
      isPrintable: boolean;
    };
  },
  async mounted() {
    if (this.fyo.store.isDevelopment) {
      // @ts-ignore
      window.cf = this;
    }

    await this.setDoc();
    focusedDocsRef.add(this.docOrNull);
    this.updateGroupedFields();
    if (this.groupedFields) {
      this.activeTab = [...this.groupedFields.keys()][0];
    }
    this.isPrintable = await isPrintable(this.schemaName);
  },
  activated(): void {
    docsPathRef.value = docsPathMap[this.schemaName] ?? '';
    focusedDocsRef.add(this.docOrNull);
  },
  deactivated(): void {
    docsPathRef.value = '';
    if (this.docOrNull) {
      focusedDocsRef.delete(this.doc);
    }
  },
  computed: {
    hasDoc(): boolean {
      return !!this.docOrNull;
    },
    hasQeDoc(): boolean {
      return !!this.quickEditDoc;
    },
    status(): string {
      if (!this.hasDoc) {
        return '';
      }

      return getDocStatus(this.doc);
    },
    doc(): Doc {
      const doc = this.docOrNull as Doc | null;
      if (!doc) {
        throw new ValidationError(
          this.t`Doc ${this.schema.label} ${this.name} not set`
        );
      }
      return doc;
    },
    qeDoc(): Doc {
      const doc = this.quickEditDoc as Doc | null;
      if (!doc) {
        throw new ValidationError(
          this.t`Doc ${this.schema.label} ${this.name} not set`
        );
      }
      return doc;
    },
    title(): string {
      if (this.schema.isSubmittable && this.docOrNull?.notInserted) {
        return this.t`New Entry`;
      }

      return this.docOrNull?.name! ?? this.t`New Entry`;
    },
    schema(): Schema {
      const schema = this.fyo.schemaMap[this.schemaName];
      if (!schema) {
        throw new ValidationError(`no schema found with ${this.schemaName}`);
      }

      return schema;
    },
    activeGroup(): Map<string, Field[]> {
      if (!this.groupedFields) {
        return new Map();
      }

      const group = this.groupedFields.get(this.activeTab);
      if (!group) {
        throw new ValidationError(
          `Tab group ${this.activeTab} has no value set`
        );
      }

      return group;
    },
    groupedActions(): ActionGroup[] {
      if (!this.hasDoc) {
        return [];
      }

      return getGroupedActionsForDoc(this.doc);
    },
  },
  methods: {
    routeTo,
    updateGroupedFields(): void {
      if (!this.hasDoc) {
        return;
      }

      this.groupedFields = getFieldsGroupedByTabAndSection(
        this.schema,
        this.doc
      );
    },
    async sync() {
      if (await commonDocSync(this.doc)) {
        this.updateGroupedFields();
      }
    },
    async submit() {
      if (await commonDocSubmit(this.doc)) {
        this.updateGroupedFields();
      }
    },
    async setDoc() {
      if (this.hasDoc) {
        return;
      }

      this.docOrNull = await getDocFromNameIfExistsElseNew(
        this.schemaName,
        this.name
      );
    },
    async toggleQuickEditDoc(doc: Doc | null) {
      if (this.quickEditDoc && doc) {
        this.quickEditDoc = null;
        await nextTick();
      }

      this.quickEditDoc = doc;
    },
    async onValueChange(field: Field, value: DocValue) {
      const { fieldname } = field;
      delete this.errors[fieldname];

      try {
        await this.doc.set(fieldname, value);
      } catch (err) {
        if (!(err instanceof Error)) {
          return;
        }

        this.errors[fieldname] = getErrorMessage(err, this.doc);
      }

      this.updateGroupedFields();
    },
  },
  components: {
    FormContainer,
    FormHeader,
    CommonFormSection,
    StatusBadge,
    Button,
    DropdownWithActions,
    QuickEditForm,
  },
});
</script>
