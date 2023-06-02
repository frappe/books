<template>
  <div class="w-form">
    <FormHeader :form-title="t`Set Print Size`" />
    <hr />
    <div class="p-4 w-full flex flex-col gap-4">
      <p class="text-base text-gray-900">
        {{
          t`Select a pre-defined page size, or set a custom page size for your Print Template.`
        }}
      </p>
      <Select
        :df="df"
        :value="size"
        @change="sizeChange"
        :border="true"
        :show-label="true"
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
    <div class="flex border-t p-4">
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
import { defineComponent } from 'vue';

const printSizes = [
  'A0',
  'A1',
  'A2',
  'A3',
  'A4',
  'A5',
  'A6',
  'A7',
  'A8',
  'A9',
  'B0',
  'B1',
  'B2',
  'B3',
  'B4',
  'B5',
  'B6',
  'B7',
  'B8',
  'B9',
  'Letter',
  'Legal',
  'Executive',
  'C5E',
  'Comm10',
  'DLE',
  'Folio',
  'Ledger',
  'Tabloid',
  'Custom',
] as const;

type SizeName = typeof printSizes[number];
const paperSizeMap: Record<SizeName, { width: number; height: number }> = {
  A0: {
    width: 84.1,
    height: 118.9,
  },
  A1: {
    width: 59.4,
    height: 84.1,
  },
  A2: {
    width: 42,
    height: 59.4,
  },
  A3: {
    width: 29.7,
    height: 42,
  },
  A4: {
    width: 21,
    height: 29.7,
  },
  A5: {
    width: 14.8,
    height: 21,
  },
  A6: {
    width: 10.5,
    height: 14.8,
  },
  A7: {
    width: 7.4,
    height: 10.5,
  },
  A8: {
    width: 5.2,
    height: 7.4,
  },
  A9: {
    width: 3.7,
    height: 5.2,
  },
  B0: {
    width: 100,
    height: 141.4,
  },
  B1: {
    width: 70.7,
    height: 100,
  },
  B2: {
    width: 50,
    height: 70.7,
  },
  B3: {
    width: 35.3,
    height: 50,
  },
  B4: {
    width: 25,
    height: 35.3,
  },
  B5: {
    width: 17.6,
    height: 25,
  },
  B6: {
    width: 12.5,
    height: 17.6,
  },
  B7: {
    width: 8.8,
    height: 12.5,
  },
  B8: {
    width: 6.2,
    height: 8.8,
  },
  B9: {
    width: 4.4,
    height: 6.2,
  },
  Letter: {
    width: 21.59,
    height: 27.94,
  },
  Legal: {
    width: 21.59,
    height: 35.56,
  },
  Executive: {
    width: 19.05,
    height: 25.4,
  },
  C5E: {
    width: 16.3,
    height: 22.9,
  },
  Comm10: {
    width: 10.5,
    height: 24.1,
  },
  DLE: {
    width: 11,
    height: 22,
  },
  Folio: {
    width: 21,
    height: 33,
  },
  Ledger: {
    width: 43.2,
    height: 27.9,
  },
  Tabloid: {
    width: 27.9,
    height: 43.2,
  },
  Custom: {
    width: -1,
    height: -1,
  },
};

export default defineComponent({
  props: { doc: { type: PrintTemplate, required: true } },
  data() {
    return { size: 'A4', width: 21, height: 29.7 };
  },
  components: { Float, FormHeader, Select, Button },
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
    done() {
      this.doc.set('width', this.width);
      this.doc.set('height', this.height);
      this.$emit('done');
    },
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
});
</script>
