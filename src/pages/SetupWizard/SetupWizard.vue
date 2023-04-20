<template>
  <FormContainer
    :show-header="false"
    class="justify-content items-center h-full"
    :class="{ 'window-drag': platform !== 'Windows' }"
  >
    <template #body>
      <FormHeader
        :form-title="t`Set up your organization`"
        class="sticky top-0 bg-white border-b"
      >
      </FormHeader>

      <!-- Section Container -->
      <div class="overflow-auto custom-scroll" v-if="hasDoc">
        <CommonFormSection
          v-for="([name, fields], idx) in activeGroup.entries()"
          :key="name + idx"
          ref="section"
          class="p-4"
          :class="idx !== 0 && activeGroup.size > 1 ? 'border-t' : ''"
          :show-title="activeGroup.size > 1 && name !== t`Default`"
          :title="name"
          :fields="fields"
          :doc="doc"
          :errors="errors"
          :collapsible="false"
          @value-change="onValueChange"
        />
      </div>

      <!-- Buttons Bar -->
      <div
        class="
          mt-auto
          p-4
          flex
          items-center
          justify-between
          border-t
          flex-shrink-0
          sticky
          bottom-0
          bg-white
        "
      >
        <p v-if="loading" class="text-base text-gray-600">
          {{ t`Loading instance...` }}
        </p>
        <Button v-if="!loading" class="w-24" @click="$emit('setup-canceled')">{{
          t`Cancel`
        }}</Button>
        <Button
          v-if="fyo.store.isDevelopment && !loading"
          class="w-24 ml-auto mr-4"
          :disabled="loading"
          @click="fill"
          >Fill</Button
        >
        <Button
          type="primary"
          class="w-24"
          :disabled="!areAllValuesFilled || loading"
          @click="submit"
          >{{ t`Submit` }}</Button
        >
      </div>
    </template>
  </FormContainer>
</template>
<script lang="ts">
import { DocValue } from 'fyo/core/types';
import { Doc } from 'fyo/model/doc';
import { Field } from 'schemas/types';
import Button from 'src/components/Button.vue';
import FormContainer from 'src/components/FormContainer.vue';
import FormHeader from 'src/components/FormHeader.vue';
import { getErrorMessage } from 'src/utils';
import { showDialog } from 'src/utils/interactive';
import { getSetupWizardDoc } from 'src/utils/misc';
import { getFieldsGroupedByTabAndSection } from 'src/utils/ui';
import { computed, defineComponent } from 'vue';
import CommonFormSection from '../CommonForm/CommonFormSection.vue';

export default defineComponent({
  name: 'SetupWizard',
  emits: ['setup-complete', 'setup-canceled'],
  data() {
    return {
      docOrNull: null,
      errors: {},
      loading: false,
    } as {
      errors: Record<string, string>;
      docOrNull: null | Doc;
      loading: boolean;
    };
  },
  provide() {
    return {
      doc: computed(() => this.docOrNull),
    };
  },
  components: {
    Button,
    FormContainer,
    FormHeader,
    CommonFormSection,
  },
  async mounted() {
    this.docOrNull = getSetupWizardDoc();

    if (this.fyo.store.isDevelopment) {
      // @ts-ignore
      window.sw = this;
    }
  },
  methods: {
    async fill() {
      if (!this.hasDoc) {
        return;
      }

      await this.doc.set('companyName', "Lin's Things");
      await this.doc.set('email', 'lin@lthings.com');
      await this.doc.set('fullname', 'Lin Slovenly');
      await this.doc.set('bankName', 'Max Finance');
      await this.doc.set('country', 'India');
    },
    async onValueChange(field: Field, value: DocValue) {
      if (!this.hasDoc) {
        return;
      }

      const { fieldname } = field;
      delete this.errors[fieldname];

      try {
        await this.doc.set(fieldname, value);
      } catch (err) {
        if (!(err instanceof Error)) {
          return;
        }

        this.errors[fieldname] = getErrorMessage(err, this.doc as Doc);
      }
    },
    async submit() {
      if (!this.hasDoc) {
        return;
      }

      if (!this.areAllValuesFilled) {
        return await showDialog({
          title: this.t`Mandatory Error`,
          detail: this.t`Please fill all values.`,
          type: 'error',
        });
      }

      this.loading = true;
      this.$emit('setup-complete', this.doc.getValidDict());
    },
  },
  computed: {
    hasDoc(): boolean {
      return this.docOrNull instanceof Doc;
    },
    doc(): Doc {
      if (this.docOrNull instanceof Doc) {
        return this.docOrNull;
      }

      throw new Error(`Doc is null`);
    },
    areAllValuesFilled(): boolean {
      if (!this.hasDoc) {
        return false;
      }

      const values = this.doc.schema.fields
        .filter((f) => f.required)
        .map((f) => this.doc[f.fieldname]);

      return values.every(Boolean);
    },
    activeGroup(): Map<string, Field[]> {
      if (!this.hasDoc) {
        return new Map();
      }

      const groupedFields = getFieldsGroupedByTabAndSection(
        this.doc.schema,
        this.doc
      );

      return [...groupedFields.values()][0];
    },
  },
});
</script>
