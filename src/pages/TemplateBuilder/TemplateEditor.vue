<template>
  <div ref="container" class="bg-white text-gray-900"></div>
</template>
<script lang="ts">
import { vue } from '@codemirror/lang-vue';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { Compartment, EditorState } from '@codemirror/state';
import { EditorView, ViewUpdate } from '@codemirror/view';
import { tags } from '@lezer/highlight';
import { basicSetup } from 'codemirror';
import { uicolors } from 'src/utils/colors';
import { defineComponent, markRaw } from 'vue';

export default defineComponent({
  data() {
    return { state: null, view: null, compartments: {}, changed: false } as {
      state: EditorState | null;
      view: EditorView | null;
      compartments: Record<string, Compartment>;
      changed: boolean;
    };
  },
  props: {
    modelModifiers: { type: Object, default: () => ({}) },
    modelValue: { type: String, required: true },
    disabled: { type: Boolean, default: false },
  },
  watch: {
    disabled(value: boolean) {
      this.setDisabled(value);
    },
  },
  emits: ['update:modelValue'],
  mounted() {
    if (!this.view) {
      this.init();
    }
  },
  methods: {
    init() {
      const readOnly = new Compartment();
      const editable = new Compartment();

      const highlightStyle = HighlightStyle.define([
        { tag: tags.typeName, color: uicolors.pink[600] },
        { tag: tags.angleBracket, color: uicolors.pink[600] },
        { tag: tags.attributeName, color: uicolors.gray[700] },
        { tag: tags.attributeValue, color: uicolors.blue[700] },
        { tag: tags.comment, color: uicolors.gray[500] },
        { tag: tags.keyword, color: uicolors.blue[500] },
        { tag: tags.variableName, color: uicolors.yellow[600] },
        { tag: tags.string, color: uicolors.pink[700] },
        { tag: tags.content, color: uicolors.gray[700] },
      ]);

      const view = new EditorView({
        doc: this.modelValue,
        extensions: [
          EditorView.updateListener.of(this.updateListener),
          readOnly.of(EditorState.readOnly.of(this.disabled)),
          editable.of(EditorView.editable.of(!this.disabled)),
          basicSetup,
          vue(),
          syntaxHighlighting(highlightStyle),
        ],
        parent: this.container,
      });
      this.view = markRaw(view);

      const compartments = { readOnly, editable };
      this.compartments = markRaw(compartments);
    },
    updateListener(update: ViewUpdate) {
      if (update.docChanged) {
        this.changed = true;
      }

      if (this.modelModifiers.lazy && !update.focusChanged) {
        return;
      }

      if (!this.changed) {
        return;
      }

      this.$emit('update:modelValue', this.view?.state.doc.toString() ?? '');
      this.changed = false;
    },
    setDisabled(value: boolean) {
      const { readOnly, editable } = this.compartments;
      this.view?.dispatch({
        effects: [
          readOnly.reconfigure(EditorState.readOnly.of(value)),
          editable.reconfigure(EditorView.editable.of(!value)),
        ],
      });
    },
  },
  computed: {
    container() {
      const { container } = this.$refs;
      if (container instanceof HTMLDivElement) {
        return container;
      }

      throw new Error('ref container is not a div element');
    },
  },
});
</script>
<style>
.cm-gutter {
  @apply bg-gray-50;
}

.cm-gutters {
  border: none !important;
}

.cm-activeLine,
.cm-activeLineGutter {
  background-color: #e5f3ff67 !important;
}
</style>
