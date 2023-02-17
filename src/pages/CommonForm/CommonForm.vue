<template>
  <FormContainer>
    <template #body>
      <FormHeader
        :form-title="title"
        :form-sub-title="schema.label"
        class="sticky top-0 bg-white border-b"
      />

      <!-- Section Container -->
      <div v-if="hasDoc" class="overflow-auto custom-scroll">
        <CommonFormSection
          ref="section"
          class="p-4"
          v-for="[name, fields] of activeGroup.entries()"
          :show-title="activeGroup.size > 1"
          :title="name"
          :fields="fields"
          :key="name"
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
        v-if="true || allGroups.size > 1"
      >
        <div
          v-for="key of allGroups.keys()"
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
  </FormContainer>
</template>

<script lang="ts">
import { Doc } from 'fyo/model/doc';
import { ValidationError } from 'fyo/utils/errors';
import { ModelNameEnum } from 'models/types';
import { Field, Schema } from 'schemas/types';
import FormContainer from 'src/components/FormContainer.vue';
import FormHeader from 'src/components/FormHeader.vue';
import { defineComponent } from 'vue';
import CommonFormSection from './CommonFormSection.vue';

type UIGroupedFields = Map<string, Map<string, Field[]>>;

export default defineComponent({
  props: {
    name: { type: String, default: 'PAY-1008' },
    schemaName: { type: String, default: ModelNameEnum.Payment },
  },
  data() {
    return {
      docOrNull: null,
      activeTab: 'Default',
    } as { docOrNull: null | Doc; activeTab: string };
  },
  async mounted() {
    if (this.name && !this.docOrNull) {
      this.docOrNull = await this.fyo.doc.getDoc(this.schemaName, this.name);
    }

    if (this.fyo.store.isDevelopment) {
      // @ts-ignore
      window.cf = this;
    }
  },
  computed: {
    hasDoc(): boolean {
      return !!this.docOrNull;
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
    title(): string {
      if (this.schema.isSubmittable && !this.docOrNull?.notInserted) {
        return this.t`New Entry`;
      }
      return this.docOrNull?.name!;
    },
    schema(): Schema {
      const schema = this.fyo.schemaMap[this.schemaName];
      if (!schema) {
        throw new ValidationError(`no schema found with ${this.schemaName}`);
      }

      return schema;
    },
    activeGroup(): Map<string, Field[]> {
      const group = this.allGroups.get(this.activeTab);
      if (!group) {
        throw new ValidationError(
          `Tab group ${this.activeTab} has no value set`
        );
      }

      return group;
    },
    allGroups(): UIGroupedFields {
      return getFieldsGroupedByTabAndSection(this.schema);
    },
  },
  components: { FormContainer, FormHeader, CommonFormSection },
});

function getFieldsGroupedByTabAndSection(schema: Schema): UIGroupedFields {
  const grouped: UIGroupedFields = new Map();
  for (const field of schema?.fields ?? []) {
    const tab = field.tab ?? 'Default';
    const section = field.section ?? 'Default';
    if (!grouped.has(tab)) {
      grouped.set(tab, new Map());
    }

    const tabbed = grouped.get(tab)!;
    if (!tabbed.has(section)) {
      tabbed.set(section, []);
    }

    tabbed.get(section)!.push(field);
  }

  return grouped;
}
</script>
