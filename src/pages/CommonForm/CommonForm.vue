<template>
  <FormContainer>
    <template #header v-if="hasDoc">
      <StatusBadge :status="status" />
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
      <Button v-if="doc?.canSave" type="primary" @click="() => doc.sync()">
        {{ t`Save` }}
      </Button>
      <Button
        v-else-if="doc?.canSubmit"
        type="primary"
        @click="() => doc.submit()"
        >{{ t`Submit` }}</Button
      >
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
        v-if="groupedFields.size > 1"
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
import { ActionGroup, UIGroupedFields } from 'src/utils/types';
import {
  getFieldsGroupedByTabAndSection,
  getGroupedActionsForDoc,
} from 'src/utils/ui';
import { computed, defineComponent, nextTick } from 'vue';
import QuickEditForm from '../QuickEditForm.vue';
import CommonFormSection from './CommonFormSection.vue';

export default defineComponent({
  props: {
    name: { type: String, default: '' },
    schemaName: { type: String, default: ModelNameEnum.StockMovement },
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
      docOrNull: null,
      activeTab: 'Default',
      quickEditDoc: null,
    } as {
      docOrNull: null | Doc;
      activeTab: string;
      quickEditDoc: null | Doc;
    };
  },
  async mounted() {
    if (this.fyo.store.isDevelopment) {
      // @ts-ignore
      window.cf = this;
    }

    await this.setDoc();
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

      return this.docOrNull?.name!?? this.t`New Entry`;
    },
    schema(): Schema {
      const schema = this.fyo.schemaMap[this.schemaName];
      if (!schema) {
        throw new ValidationError(`no schema found with ${this.schemaName}`);
      }

      return schema;
    },
    activeGroup(): Map<string, Field[]> {
      const group = this.groupedFields.get(this.activeTab);
      if (!group) {
        throw new ValidationError(
          `Tab group ${this.activeTab} has no value set`
        );
      }

      return group;
    },
    groupedFields(): UIGroupedFields {
      return getFieldsGroupedByTabAndSection(this.schema);
    },
    groupedActions(): ActionGroup[] {
      if (!this.hasDoc) {
        return [];
      }

      return getGroupedActionsForDoc(this.doc);
    },
  },
  methods: {
    async setDoc() {
      if (this.hasDoc) {
        return;
      }

      if (this.name) {
        this.docOrNull = await this.fyo.doc.getDoc(this.schemaName, this.name);
      } else {
        this.docOrNull = this.fyo.doc.getNewDoc(this.schemaName);
      }
    },
    async toggleQuickEditDoc(doc: Doc | null) {
      if (this.quickEditDoc && doc) {
        this.quickEditDoc = null;
        await nextTick();
      }

      this.quickEditDoc = doc;
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
