<template>
  <div class="w-form">
    <FormHeader :form-title="t`Set Print Size`" />
    <hr class="dark:border-gray-800" />
    <div class="p-4 w-full flex flex-col gap-4">
      <p class="text-base text-gray-900 dark:text-gray-100">
        {{ t`Select the template type.` }}
      </p>
      <Select
        :df="df"
        :value="type"
        :border="true"
        :show-label="true"
        @change="typeChange"
      />
    </div>
    <div class="flex border-t dark:border-gray-800 p-4">
      <Button class="ml-auto" type="primary" @click="done">{{
        t`Done`
      }}</Button>
    </div>
  </div>
</template>
<script lang="ts">
import { PrintTemplate } from 'models/baseModels/PrintTemplate';
import { OptionField } from 'schemas/types';
import Button from 'src/components/Button.vue';
import Select from 'src/components/Controls/Select.vue';
import FormHeader from 'src/components/FormHeader.vue';
import { defineComponent } from 'vue';

export default defineComponent({
  components: { FormHeader, Select, Button },
  props: { doc: { type: PrintTemplate, required: true } },
  emits: ['done'],
  data() {
    return { type: 'SalesInvoice' };
  },
  computed: {
    df(): OptionField {
      const options = PrintTemplate.lists.type(this.doc);
      return {
        ...fyo.getField('PrintTemplate', 'type'),
        options,
        fieldtype: 'Select',
        default: options[0].value,
      } as OptionField;
    },
  },
  mounted() {
    this.type = this.doc.type ?? 'SalesInvoice';
  },
  methods: {
    typeChange(v: string) {
      if (this.type === v) {
        return;
      }

      this.type = v;
    },
    async done() {
      await this.doc.set('type', this.type);
      this.$emit('done');
    },
  },
});
</script>
