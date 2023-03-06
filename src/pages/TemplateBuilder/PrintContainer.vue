<template>
  <ScaledContainer
    :scale="Math.max(scale, 0.1)"
    ref="scaledContainer"
    class="mx-auto shadow-lg border"
  >
    <!-- Template -->
    <component
      class="flex-1 bg-white"
      :doc="values.doc"
      :print="values.print"
      :is="{ template, props: ['doc', 'print'] }"
    />
  </ScaledContainer>
</template>
<script lang="ts">
import { getPathAndMakePDF } from 'src/utils/printTemplates';
import { PrintValues } from 'src/utils/types';
import { defineComponent, PropType } from 'vue';
import ScaledContainer from './ScaledContainer.vue';

export default defineComponent({
  props: {
    template: { type: String, required: true },
    scale: { type: Number, default: 0.65 },
    values: {
      type: Object as PropType<PrintValues>,
      required: true,
    },
  },
  methods: {
    async savePDF(name?: string) {
      /**
       * To be called through ref by the parent component.
       */

      // @ts-ignore
      const innerHTML = this.$refs.scaledContainer.$el.children[0].innerHTML;
      if (typeof innerHTML !== 'string') {
        return;
      }

      await getPathAndMakePDF(name ?? this.t`Entry`, innerHTML);
    },
  },
  components: { ScaledContainer },
});
</script>
