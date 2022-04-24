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
        @change="(value) => onChange(df, value)"
      />

      <!-- Inline Field Form (Eg: Address) -->
      <div
        v-else-if="renderInline(df)"
        class="border-b"
        :key="`${df.fieldname}-inline`"
      >
        <TwoColumnForm
          ref="inlineEditForm"
          :doc="inlineEditDoc"
          :fields="inlineEditFields"
          :column-ratio="columnRatio"
          :no-border="true"
          :focus-first-input="true"
          :autosave="false"
          @error="(msg) => $emit('error', msg)"
        />
        <div class="flex px-4 pb-2">
          <Button class="w-1/2 text-gray-900" @click="inlineEditField = null">
            {{ t`Cancel` }}
          </Button>
          <Button
            type="primary"
            class="ml-2 w-1/2 text-white"
            @click="() => saveInlineEditDoc(df)"
          >
            {{ df.inlineSaveText || t`Save` }}
          </Button>
        </div>
      </div>

      <!-- Regular Field Form -->
      <div
        v-else
        class="grid"
        :class="{ 'border-b': !noBorder }"
        :key="`${df.fieldname}-regular`"
        :style="style"
      >
        <div class="py-2 pl-4 flex text-gray-600">
          <div class="py-1">
            {{ df.label }}
          </div>
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
            @change="(value) => onChange(df, value)"
            @focus="activateInlineEditing(df)"
            @new-doc="(newdoc) => onChange(df, newdoc.name)"
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
import { getErrorMessage, handleErrorWithDialog } from 'src/errorHandling';
import { fyo } from 'src/initFyo';
import { evaluateHidden, evaluateReadOnly } from 'src/utils/doc';

export default {
  name: 'TwoColumnForm',
  emits: ['error', 'change'],
  props: {
    doc: Doc,
    fields: Array,
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
      inlineEditField: null,
      inlineEditDoc: null,
      inlineEditFields: null,
      inlineEditDisplayField: null,
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
    if (this.focusFirstInput) {
      this.$refs['controls'][0].focus();
    }
    window.tcf = this;
  },
  methods: {
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
      if (df.fieldname === 'numberSeries' && !this.doc._notInserted) {
        return true;
      }

      if (this.submitted) {
        return true;
      }

      return evaluateReadOnly(df, this.doc);
    },
    onChange(df, value) {
      if (df.inline) {
        return;
      }

      let oldValue = this.doc.get(df.fieldname);
      if (oldValue === value) {
        return;
      }

      this.errors[df.fieldname] = null;
      if (this.emitChange) {
        this.$emit('change', df, value, oldValue);
      }

      // handle rename
      if (this.autosave && df.fieldname === 'name' && !this.doc.isNew()) {
        return this.doc.rename(value);
      }

      this.onChangeCommon(df, value);
    },
    onChangeCommon(df, value) {
      this.doc.set(df.fieldname, value).catch((e) => {
        // set error message for this field
        this.errors[df.fieldname] = getErrorMessage(e, this.doc);
      });

      if (this.autosave && this.doc._dirty && !this.doc.isNew()) {
        if (df.fieldtype === 'Table') {
          return;
        }
        this.doc.sync();
      }
    },
    sync() {
      return this.doc.sync().catch(this.handleError);
    },
    submit() {
      return this.doc.submit().catch(this.handleError);
    },
    handleError(e) {
      handleErrorWithDialog(e, this.doc);
    },
    async activateInlineEditing(df) {
      if (!df.inline) {
        return;
      }

      this.inlineEditField = df;
      if (!this.doc[df.fieldname]) {
        this.inlineEditDoc = await fyo.doc.getNewDoc(df.target);
        this.inlineEditDoc.once('afterInsert', () => {
          this.onChangeCommon(df, this.inlineEditDoc.name);
        });
      } else {
        this.inlineEditDoc = this.doc.getLink(df.fieldname);
      }

      this.inlineEditDisplayField =
        this.doc.schema.inlineEditDisplayField ?? 'name';
      this.inlineEditFields = fyo.schemaMap[df.target].quickEditFields ?? [];
    },
    async saveInlineEditDoc(df) {
      if (!this.inlineEditDoc) {
        return;
      }
      await this.$refs.inlineEditForm[0].sync();
      await this.doc.loadLinks();

      if (this.emitChange && df.inline) {
        this.$emit('change', df.inlineEditField);
      }

      this.inlineEditField = null;
    },
  },
  computed: {
    formFields() {
      return (this.fields || this.doc.quickEditFields).filter(
        (field) => !evaluateHidden(field, this.doc)
      );
    },
    style() {
      let templateColumns = (this.columnRatio || [1, 1])
        .map((r) => `${r}fr`)
        .join(' ');
      return {
        'grid-template-columns': templateColumns,
      };
    },
    submitted() {
      return Boolean(this.doc.schema.isSubmittable && this.doc.submitted);
    },
  },
};
</script>
