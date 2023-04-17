<template>
  <div class="border-s h-full overflow-auto w-quick-edit bg-white">
    <!-- Quick edit Tool bar -->
    <div
      class="
        flex
        items-center
        justify-between
        px-4
        h-row-largest
        sticky
        top-0
        border-b
        bg-white
      "
      style="z-index: 1"
    >
      <!-- Close Button and Status Text -->
      <div class="flex items-center">
        <Button :icon="true" @click="routeToPrevious">
          <feather-icon name="x" class="w-4 h-4" />
        </Button>
        <span v-if="statusText" class="ms-2 text-base text-gray-600">{{
          statusText
        }}</span>
      </div>

      <!-- Actions, Badge and Status Change Buttons -->
      <div class="flex items-stretch gap-2">
        <StatusBadge :status="status" />
        <DropdownWithActions :actions="actions" />
        <Button
          :icon="true"
          @click="sync"
          type="primary"
          v-if="doc?.canSave"
          class="text-white text-xs"
        >
          {{ t`Save` }}
        </Button>
        <Button
          :icon="true"
          @click="submit"
          type="primary"
          v-else-if="doc?.canSubmit"
          class="text-white text-xs"
        >
          {{ t`Submit` }}
        </Button>
      </div>
    </div>

    <!-- Name and image -->
    <div
      class="items-center"
      :class="imageField ? 'grid' : 'flex justify-center'"
      :style="{
        height: `calc(var(--h-row-mid) * ${!!imageField ? '2 + 1px' : '1'})`,
        gridTemplateColumns: `minmax(0, 1.1fr) minmax(0, 2fr)`,
      }"
      v-if="doc && (titleField || imageField)"
    >
      <FormControl
        v-if="imageField"
        class="ms-4"
        :df="imageField"
        :value="doc[imageField.fieldname]"
        @change="(value) => valueChange(imageField as Field, value)"
        :letter-placeholder="letterPlaceHolder"
      />
      <FormControl
        v-if="titleField"
        :class="!!imageField ? 'me-4' : 'w-full mx-4'"
        :input-class="[
          'font-semibold text-xl',
          !!imageField ? '' : 'text-center',
        ]"
        ref="titleControl"
        size="small"
        :df="titleField"
        :value="doc[titleField.fieldname]"
        :read-only="doc.inserted || doc.schema.naming !== 'manual'"
        @change="(value) => valueChange(titleField as Field, value)"
      />
    </div>

    <!-- Rest of the form -->
    <TwoColumnForm
      v-if="doc"
      class="w-full"
      ref="form"
      :doc="doc"
      :fields="fields"
      :column-ratio="[1.1, 2]"
    />
  </div>
</template>
<script lang="ts">
import { computed } from '@vue/reactivity';
import { t } from 'fyo';
import { DocValue } from 'fyo/core/types';
import { DocStatus } from 'fyo/model/types';
import { getDocStatus } from 'models/helpers';
import { InvoiceStatus } from 'models/types';
import { Field, Schema } from 'schemas/types';
import Button from 'src/components/Button.vue';
import FormControl from 'src/components/Controls/FormControl.vue';
import DropdownWithActions from 'src/components/DropdownWithActions.vue';
import StatusBadge from 'src/components/StatusBadge.vue';
import TwoColumnForm from 'src/components/TwoColumnForm.vue';
import { fyo } from 'src/initFyo';
import { shortcutsKey } from 'src/utils/injectionKeys';
import { DocRef } from 'src/utils/types';
import {
  commonDocSubmit,
  commonDocSync,
  focusOrSelectFormControl,
  getActionsForDoc,
} from 'src/utils/ui';
import { useDocShortcuts } from 'src/utils/vueUtils';
import { defineComponent, inject, ref } from 'vue';

export default defineComponent({
  name: 'QuickEditForm',
  props: {
    name: { type: String, required: true },
    schemaName: { type: String, required: true },
    hideFields: { type: Array, default: () => [] },
    showFields: { type: Array, default: () => [] },
  },
  components: {
    Button,
    FormControl,
    StatusBadge,
    TwoColumnForm,
    DropdownWithActions,
  },
  emits: ['close'],
  setup() {
    const doc = ref(null) as DocRef;
    const shortcuts = inject(shortcutsKey);

    let context = 'QuickEditForm';
    if (shortcuts) {
      context = useDocShortcuts(shortcuts, doc, context, true);
    }

    return {
      form: ref<InstanceType<typeof TwoColumnForm> | null>(null),
      doc,
      context,
      shortcuts,
    };
  },
  provide() {
    return {
      doc: computed(() => this.doc),
    };
  },
  data() {
    return {
      titleField: null,
      imageField: null,
      statusText: '',
    } as {
      titleField: null | Field;
      imageField: null | Field;
      statusText: string;
    };
  },
  activated() {
    console.log('act');
    this.setShortcuts();
  },
  async mounted() {
    console.log('mou');
    await this.initialize();

    if (fyo.store.isDevelopment) {
      // @ts-ignore
      window.qef = this;
    }

    this.setShortcuts();
  },
  computed: {
    letterPlaceHolder() {
      if (!this.doc) {
        return '';
      }

      const fn = this.titleField?.fieldname ?? 'name';
      const value = this.doc.get(fn);
      if (typeof value === 'string') {
        return value[0];
      }

      return '';
    },
    schema(): Schema {
      return fyo.schemaMap[this.schemaName]!;
    },
    status(): DocStatus | InvoiceStatus {
      if (!this.doc) {
        return 'Draft';
      }

      return getDocStatus(this.doc);
    },
    fields() {
      if (!this.schema) {
        return [];
      }

      const fieldnames = (this.schema.quickEditFields ?? ['name']).filter(
        (f) => !this.hideFields.includes(f)
      );

      if (this.showFields?.length) {
        fieldnames.push(
          ...this.schema.fields
            .map((f) => f.fieldname)
            .filter((f) => this.showFields.includes(f))
        );
      }

      return fieldnames.map((f) => fyo.getField(this.schemaName, f));
    },
    actions() {
      if (!this.doc) {
        return [];
      }

      return getActionsForDoc(this.doc);
    },
  },
  methods: {
    setShortcuts() {
      if (this.shortcuts?.has(this.context, ['Escape'])) {
        return;
      }

      this.shortcuts?.set(this.context, ['Escape'], () => {
        this.routeToPrevious();
      });
    },
    async initialize() {
      if (!this.schema) {
        return;
      }

      this.setFields();
      await this.setDoc();
      if (!this.doc) {
        return;
      }

      focusOrSelectFormControl(this.doc, this.$refs.titleControl, false);
    },
    setFields() {
      const titleFieldName = this.schema.titleField ?? 'name';
      this.titleField = fyo.getField(this.schemaName, titleFieldName) ?? null;
      this.imageField = fyo.getField(this.schemaName, 'image') ?? null;
    },
    async setDoc() {
      try {
        this.doc = await fyo.doc.getDoc(this.schemaName, this.name);
      } catch (e) {
        return this.$router.back();
      }
    },
    valueChange(field: Field, value: DocValue) {
      this.form?.onChange(field, value);
    },
    async sync() {
      if (!this.doc) {
        return;
      }

      this.statusText = t`Saving`;
      await commonDocSync(this.doc);
      setTimeout(() => {
        this.statusText = '';
      }, 300);
    },
    async submit() {
      if (!this.doc) {
        return;
      }

      this.statusText = t`Submitting`;
      await commonDocSubmit(this.doc);
      setTimeout(() => {
        this.statusText = '';
      }, 300);
    },
    async routeToPrevious() {
      if (this.doc?.dirty && this.doc?.inserted) {
        await this.doc.load();
      }

      if (this.doc && this.doc.notInserted) {
        await this.doc.delete();
      }

      this.$router.back();
    },
  },
});
</script>
