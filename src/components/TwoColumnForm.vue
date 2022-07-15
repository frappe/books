<template>
  <div class="text-sm" :class="{ 'border-t': !noBorder }">
    <template v-for="df in formFields">
      <!-- Table Field Form (Eg: PaymentFor) -->
      <FormControl
        v-if="df.fieldtype === 'Table'"
        :key="`${df.fieldname}-table`"
        ref="controls"
        size="small"
        :df="df"
        :value="doc[df.fieldname]"
        :read-only="evaluateReadOnly(df)"
        @change="async (value) => await onChange(df, value)"
      />

      <!-- Inline Field Form (Eg: Address) -->
      <div
        v-else-if="renderInline(df)"
        class="border-b"
        :key="`${df.fieldname}-inline`"
      >
        <TwoColumnForm
          class="overflow-auto"
          style="max-height: calc((var(--h-row-mid) + 1px) * 3 - 1px)"
          ref="inlineEditForm"
          :doc="inlineEditDoc"
          :fields="getInlineEditFields(df)"
          :column-ratio="columnRatio"
          :no-border="true"
          :focus-first-input="true"
          :autosave="false"
          @error="(msg) => $emit('error', msg)"
        />
        <div
          class="flex px-4 py-4 justify-between items-center"
          style="max-height: calc(var(--h-row-mid) + 1px)"
        >
          <Button class="text-gray-900 w-20" @click="stopInlineEditing">
            {{ t`Cancel` }}
          </Button>
          <Button
            type="primary"
            class="text-white w-20"
            @click="saveInlineEditDoc(df)"
          >
            {{ t`Save` }}
          </Button>
        </div>
      </div>

      <!-- Regular Field Form -->
      <div
        v-else
        class="grid items-center"
        :class="{
          'border-b': !noBorder,
        }"
        :key="`${df.fieldname}-regular`"
        :style="{
          ...style,

          height: getFieldHeight(df),
        }"
      >
        <div class="pl-4 flex text-gray-600">
          {{ df.label }}
        </div>

        <div
          class="py-2 pr-4"
          @click="activateInlineEditing(df)"
          :class="{
            'pl-2': df.fieldtype === 'AttachImage',
          }"
        >
          <FormControl
            ref="controls"
            size="small"
            :df="df"
            :value="getRegularValue(df)"
            :class="{ 'p-2': df.fieldtype === 'Check' }"
            :read-only="evaluateReadOnly(df)"
            input-class="bg-transparent"
            @change="async (value) => await onChange(df, value)"
            @focus="activateInlineEditing(df)"
            @new-doc="async (newdoc) => await onChange(df, newdoc.name)"
          />
          <div
            class="text-sm text-red-600 mt-2 pl-2"
            v-if="errors[df.fieldname]"
          >
            {{ errors[df.fieldname] }}
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
<script>
import { Doc } from 'fyo/model/doc';
import Button from 'src/components/Button.vue';
import FormControl from 'src/components/Controls/FormControl.vue';
import { handleErrorWithDialog } from 'src/errorHandling';
import { fyo } from 'src/initFyo';
import { getErrorMessage } from 'src/utils';
import { evaluateHidden, evaluateReadOnly } from 'src/utils/doc';

export default {
  name: 'TwoColumnForm',
  emits: ['error', 'change'],
  props: {
    doc: Doc,
    fields: { type: Array, default: () => [] },
    autosave: Boolean,
    columnRatio: {
      type: Array,
      default: () => [1, 1],
    },
    emitChange: {
      type: Boolean,
      default: false,
    },
    noBorder: Boolean,
    focusFirstInput: Boolean,
  },
  data() {
    return {
      inlineEditDoc: null,
      inlineEditField: null,
      formFields: [],
      errors: {},
    };
  },
  provide() {
    return {
      schemaName: this.doc.schemaName,
      name: this.doc.name,
      doc: this.doc,
    };
  },
  components: {
    FormControl,
    Button,
    TwoColumnForm: () => TwoColumnForm,
  },
  mounted() {
    this.setFormFields();
    if (this.focusFirstInput) {
      this.$refs['controls']?.[0].focus();
    }

    if (fyo.store.isDevelopment) {
      window.tcf = this;
    }
  },
  methods: {
    getFieldHeight(df) {
      if (['AttachImage', 'Text'].includes(df.fieldtype)) {
        return 'calc((var(--h-row-mid) + 1px) * 2)';
      }

      if (this.errors[df.fieldname]) {
        return 'calc((var(--h-row-mid) + 1px) * 2)';
      }

      return 'calc(var(--h-row-mid) + 1px)';
    },
    getRegularValue(df) {
      if (!df.inline) {
        return this.doc[df.fieldname];
      }

      const link = this.doc.getLink(df.fieldname);
      if (!link) {
        return this.doc[df.fieldname];
      }

      const fieldname = link.schema.inlineEditDisplayField ?? 'name';
      return link[fieldname];
    },
    renderInline(df) {
      return (
        this.inlineEditField?.fieldname === df?.fieldname && this.inlineEditDoc
      );
    },
    evaluateReadOnly(df) {
      if (df.fieldname === 'numberSeries' && !this.doc.notInserted) {
        return true;
      }

      if (this.submitted || this.doc.parentdoc?.isSubmitted) {
        return true;
      }

      return evaluateReadOnly(df, this.doc);
    },
    async onChange(df, value) {
      if (df.inline) {
        return;
      }

      // handle rename
      if (this.autosave && df.fieldname === 'name' && this.doc.inserted) {
        return this.doc.rename(value);
      }

      const oldValue = this.doc.get(df.fieldname);
      this.errors[df.fieldname] = null;
      await this.onChangeCommon(df, value, oldValue);
    },
    async onChangeCommon(df, value, oldValue) {
      let isSet = false;
      try {
        isSet = await this.doc.set(df.fieldname, value);
      } catch (err) {
        this.errors[df.fieldname] = getErrorMessage(err, this.doc);
      }

      if (!isSet) {
        return;
      }

      await this.handlePostSet(df, value, oldValue);
    },
    async handlePostSet(df, value, oldValue) {
      this.setFormFields();
      if (this.emitChange) {
        this.$emit('change', df, value, oldValue);
      }

      if (this.autosave && this.doc.dirty) {
        if (df.fieldtype === 'Table') {
          return;
        }

        await this.doc.sync();
      }
    },
    async sync() {
      try {
        await this.doc.sync();
      } catch (err) {
        await handleErrorWithDialog(err, this.doc);
      }
    },
    async submit() {
      try {
        await this.doc.submit();
      } catch (err) {
        await handleErrorWithDialog(err, this.doc);
      }
    },
    async activateInlineEditing(df) {
      if (!df.inline) {
        return;
      }

      this.inlineEditField = df;
      if (!this.doc[df.fieldname]) {
        this.inlineEditDoc = await fyo.doc.getNewDoc(df.target);
      } else {
        this.inlineEditDoc = this.doc.getLink(df.fieldname);
      }
    },
    getInlineEditFields(df) {
      const inlineEditFieldNames =
        fyo.schemaMap[df.target].quickEditFields ?? [];
      return inlineEditFieldNames.map((fieldname) =>
        fyo.getField(df.target, fieldname)
      );
    },
    async saveInlineEditDoc(df) {
      if (!this.inlineEditDoc) {
        return;
      }

      await this.inlineEditDoc.sync();
      await this.onChangeCommon(df, this.inlineEditDoc.name);
      await this.doc.loadLinks();

      if (this.emitChange) {
        this.$emit('change', this.inlineEditField);
      }

      await this.stopInlineEditing();
    },
    async stopInlineEditing() {
      if (this.inlineEditDoc?.dirty && !this.inlineEditDoc?.notInserted) {
        await this.inlineEditDoc.load();
      }

      this.inlineEditDoc = null;
      this.inlineEditField = null;
    },
    setFormFields() {
      let fieldList = this.fields;

      if (fieldList.length === 0) {
        fieldList = this.doc.quickEditFields;
      }

      if (fieldList.length === 0) {
        fieldList = this.doc.schema.fields.filter((f) => f.required);
      }

      this.formFields = fieldList.filter(
        (field) => field && !evaluateHidden(field, this.doc)
      );
    },
  },
  computed: {
    style() {
      let templateColumns = (this.columnRatio || [1, 1])
        .map((r) => `${r}fr`)
        .join(' ');
      return {
        'grid-template-columns': templateColumns,
      };
    },
    submitted() {
      return this.doc.isSubmitted;
    },
  },
};
</script>
