<template>
  <div ref="container"></div>
</template>
<script lang="ts">
import { vue } from '@codemirror/lang-vue';
import { Compartment, EditorState } from '@codemirror/state';
import { ViewUpdate, EditorView } from '@codemirror/view';
import { basicSetup } from 'codemirror';
import { defineComponent } from 'vue';
import { markRaw } from 'vue';

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

    // @ts-ignore
    window.vte = this;
  },
  methods: {
    init() {
      const readOnly = new Compartment();
      const editable = new Compartment();

      const view = new EditorView({
        doc: this.modelValue,
        extensions: [
          EditorView.updateListener.of(this.updateListener),
          readOnly.of(EditorState.readOnly.of(this.disabled)),
          editable.of(EditorView.editable.of(!this.disabled)),
          basicSetup,
          vue(),
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
