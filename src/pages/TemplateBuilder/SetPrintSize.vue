<template>
  <div class="w-form">
    <FormHeader :form-title="t`Set Print Size`" />
    <hr class="dark:border-gray-800" />
    <div class="p-4 w-full flex flex-col gap-4">
      <p class="text-base text-gray-900 dark:text-gray-100">
        {{
          t`Select a pre-defined page size, or set a custom page size for your Print Template.`
        }}
      </p>
      <Select
        :df="df"
        :value="size"
        :border="true"
        :show-label="true"
        @change="sizeChange"
      />
      <div class="flex gap-4 w-full">
        <Float
          class="w-full"
          :df="fyo.getField('PrintTemplate', 'height')"
          :border="true"
          :show-label="true"
          :value="height"
          @change="(v) => valueChange(v, 'height')"
        />
        <Float
          class="w-full"
          :df="fyo.getField('PrintTemplate', 'width')"
          :border="true"
          :show-label="true"
          :value="width"
          @change="(v) => valueChange(v, 'width')"
        />
      </div>
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
import Float from 'src/components/Controls/Float.vue';
import Select from 'src/components/Controls/Select.vue';
import FormHeader from 'src/components/FormHeader.vue';
import { paperSizeMap, printSizes } from 'src/utils/ui';
import { defineComponent } from 'vue';

type SizeName = typeof printSizes[number];
export default defineComponent({
  components: { Float, FormHeader, Select, Button },
  props: { doc: { type: PrintTemplate, required: true } },
  emits: ['done'],
  data() {
    return { size: 'A4', width: 21, height: 29.7 };
  },
  computed: {
    df(): OptionField {
      return {
        label: 'Page Size',
        fieldname: 'size',
        fieldtype: 'Select',
        options: printSizes.map((value) => ({ value, label: value })),
        default: 'A4',
      };
    },
  },
  mounted() {
    this.width = this.doc.width ?? 21;
    this.height = this.doc.height ?? 29.7;

    this.size = '';
    Object.entries(paperSizeMap).forEach(([name, { width, height }]) => {
      if (this.width === width && this.height === height) {
        this.size = name;
      }
    });

    this.size ||= 'Custom';
  },
  methods: {
    sizeChange(v: string) {
      const size = paperSizeMap[v as SizeName];
      if (!size) {
        return;
      }

      this.height = size.height;
      this.width = size.width;
    },
    valueChange(v: number, name: 'width' | 'height') {
      if (this[name] === v) {
        return;
      }

      this.size = 'Custom';
      this[name] = v;
    },
    async done() {
      await this.doc.set('width', this.width);
      await this.doc.set('height', this.height);
      this.$emit('done');
    },
  },
});
</script>
