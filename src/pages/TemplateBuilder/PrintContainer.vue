<template>
  <ScaledContainer
    :scale="Math.max(scale, 0.1)"
    ref="scaledContainer"
    class="mx-auto shadow-lg border"
  >
    <ErrorBoundary
      v-if="!error"
      @error-captured="handleErrorCaptured"
      :propagate="false"
    >
      <!-- Template -->
      <component
        class="flex-1 bg-white"
        :doc="values.doc"
        :print="values.print"
        :is="templateComponent"
      />
    </ErrorBoundary>

    <!-- Compilation Error -->
    <div
      v-else
      class="
        h-full
        bg-red-100
        w-full
        text-2xl text-gray-900
        flex flex-col
        gap-4
      "
    >
      <h1 class="text-4xl font-bold text-red-500 p-4 border-b border-red-200">
        {{ error.name }}
      </h1>
      <p class="px-4 font-semibold">{{ error.message }}</p>
      <pre v-if="error.detail" class="px-4 text-xl text-gray-700">{{
        error.detail
      }}</pre>
    </div>
  </ScaledContainer>
</template>
<script lang="ts">
import {
  compile,
  CompilerError,
  generateCodeFrame,
  SourceLocation,
} from '@vue/compiler-dom';
import ErrorBoundary from 'src/components/ErrorBoundary.vue';
import { getPathAndMakePDF } from 'src/utils/printTemplates';
import { PrintValues } from 'src/utils/types';
import { defineComponent, PropType } from 'vue';
import ScaledContainer from './ScaledContainer.vue';

export const baseSafeTemplate = `<main class="h-full w-full bg-white">
  <p class="p-4 text-red-500">
    <span class="font-bold">ERROR</span>: Template failed to load due to errors.
  </p>
</main>
`;

export default defineComponent({
  data() {
    return { error: null } as {
      error: null | { name: string; message: string; detail?: string };
    };
  },
  props: {
    template: { type: String, required: true },
    scale: { type: Number, default: 0.65 },
    values: {
      type: Object as PropType<PrintValues>,
      required: true,
    },
  },
  watch: {
    template(value: string) {
      this.compile(value);
    },
  },
  mounted() {
    this.compile(this.template);
  },
  methods: {
    compile(template: string) {
      /**
       * Note: This is a hacky method to prevent
       * broken templates from reaching the `<component />`
       * element.
       *
       * It's required because the CompilerOptions doesn't
       * have an option to capture the errors.
       *
       * The compile function returns a code that can be
       * converted into a render function.
       *
       * This render function can be used instead
       * of passing the template to the `<component />` element
       * where it gets compiled again.
       */
      this.error = null;
      return compile(template, {
        hoistStatic: true,
        onWarn: this.onError,
        onError: this.onError,
      });
    },
    handleErrorCaptured(error: unknown) {
      if (!(error instanceof Error)) {
        throw error;
      }

      const message = error.message;
      let name = error.name;
      let detail = '';
      if (name === 'TypeError' && message.includes('Cannot read')) {
        name = this.t`Invalid Key Error`;
        detail = this.t`Please check Key Hints for valid key names`;
      }

      this.error = { name, message, detail };
    },
    onError({ message, loc }: CompilerError) {
      const codeframe = loc ? this.getCodeFrame(loc) : '';

      this.error = {
        name: this.t`Template Compilation Error`,
        detail: codeframe,
        message,
      };
    },
    getCodeFrame(loc: SourceLocation) {
      return generateCodeFrame(this.template, loc.start.offset, loc.end.offset);
    },
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
  computed: {
    templateComponent() {
      let template = this.template;
      if (this.error) {
        template = baseSafeTemplate;
      }

      return {
        template,
        props: ['doc', 'print'],
        computed: {
          fyo() {
            return {};
          },
          platform() {
            return '';
          },
        },
      };
    },
  },
  components: { ScaledContainer, ErrorBoundary },
});
</script>
