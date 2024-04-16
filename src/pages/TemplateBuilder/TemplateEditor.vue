<template>
  <div
    ref="container"
    class="bg-white dark:bg-gray-875 text-gray-900 dark:text-gray-100"
  ></div>
</template>
<script lang="ts">
import { autocompletion, CompletionContext } from '@codemirror/autocomplete';
import { vue } from '@codemirror/lang-vue';
import {
  HighlightStyle,
  syntaxHighlighting,
  syntaxTree,
} from '@codemirror/language';
import { Compartment, EditorState } from '@codemirror/state';
import { EditorView, ViewUpdate } from '@codemirror/view';
import { tags } from '@lezer/highlight';
import { basicSetup } from 'codemirror';
import { uicolors } from 'src/utils/colors';
import { defineComponent, markRaw } from 'vue';

export default defineComponent({
  props: {
    initialValue: { type: String, required: true },
    disabled: { type: Boolean, default: false },
    hints: { type: Object, default: undefined },
  },
  emits: ['input', 'blur'],
  data() {
    return { state: null, view: null, compartments: {} } as {
      state: EditorState | null;
      view: EditorView | null;
      compartments: Record<string, Compartment>;
    };
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
  watch: {
    disabled(value: boolean) {
      this.setDisabled(value);
    },
  },
  mounted() {
    if (!this.view) {
      this.init();
    }

    if (this.fyo.store.isDevelopment) {
      // @ts-ignore
      window.te = this;
    }
  },
  methods: {
    init() {
      const readOnly = new Compartment();
      const editable = new Compartment();

      const highlightStyle = HighlightStyle.define([
        { tag: tags.typeName, color: uicolors.pink[600] },
        { tag: tags.angleBracket, color: uicolors.pink[600] },
        { tag: tags.attributeName, color: uicolors.gray[500] },
        { tag: tags.attributeValue, color: uicolors.blue[500] },
        { tag: tags.comment, color: uicolors.gray[500], fontStyle: 'italic' },
        { tag: tags.keyword, color: uicolors.orange[600] },
        { tag: tags.variableName, color: uicolors.teal[600] },
        { tag: tags.string, color: uicolors.blue[700] },
      ]);
      const completions = getCompletionsFromHints(this.hints ?? {});

      const view = new EditorView({
        doc: this.initialValue,
        extensions: [
          EditorView.updateListener.of(this.updateListener.bind(this)),
          readOnly.of(EditorState.readOnly.of(this.disabled)),
          editable.of(EditorView.editable.of(!this.disabled)),
          basicSetup,
          vue(),
          syntaxHighlighting(highlightStyle),
          autocompletion({ override: [completions] }),
        ],
        parent: this.container,
      });
      this.view = markRaw(view);

      const compartments = { readOnly, editable };
      this.compartments = markRaw(compartments);
    },
    updateListener(update: ViewUpdate) {
      if (update.docChanged) {
        this.$emit('input', this.view?.state.doc.toString() ?? '');
      }

      if (update.focusChanged && !this.view?.hasFocus) {
        this.$emit('blur', this.view?.state.doc.toString() ?? '');
      }
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
});

function getCompletionsFromHints(hints: Record<string, unknown>) {
  const options = hintsToCompletionOptions(hints);
  return function completions(context: CompletionContext) {
    let word = context.matchBefore(/\w*/);
    if (word == null) {
      return null;
    }

    const node = syntaxTree(context.state).resolveInner(context.pos);
    const aptLocation = ['ScriptAttributeValue', 'SingleExpression'];

    if (!aptLocation.includes(node.name)) {
      return null;
    }

    if (word.from === word.to && !context.explicit) {
      return null;
    }

    return {
      from: word.from,
      options,
    };
  };
}

type CompletionOption = {
  label: string;
  type: string;
  detail: string;
};

function hintsToCompletionOptions(
  hints: object,
  prefix?: string
): CompletionOption[] {
  prefix ??= '';
  const list: CompletionOption[] = [];

  for (const [key, value] of Object.entries(hints)) {
    const option = getCompletionOption(key, value, prefix);
    if (option === null) {
      continue;
    }

    if (Array.isArray(option)) {
      list.push(...option);
      continue;
    }

    list.push(option);
  }

  return list;
}

function getCompletionOption(
  key: string,
  value: unknown,
  prefix: string
): null | CompletionOption | CompletionOption[] {
  let label = key;
  if (prefix.length) {
    label = prefix + '.' + key;
  }

  if (Array.isArray(value)) {
    return {
      label,
      type: 'variable',
      detail: 'Child Table',
    };
  }

  if (typeof value === 'string') {
    return {
      label,
      type: 'variable',
      detail: value,
    };
  }

  if (typeof value === 'object' && value !== null) {
    return hintsToCompletionOptions(value, label);
  }

  return null;
}
</script>
<style>
.cm-line {
  font-weight: 600;
}

.cm-gutter {
  @apply bg-gray-50 dark:bg-gray-850;
}

.cm-gutters {
  border: none black !important;
  border-right: 1px solid theme('colors.gray.200') !important;
}

.dark .cm-gutters {
  border: none white !important;
  border-right: 1px solid theme('colors.gray.800') !important;
}

.cm-activeLine,
.cm-activeLineGutter {
  background-color: #72839216 !important;
}

.cm-tooltip-autocomplete {
  background-color: white !important;
  border: 1px solid theme('colors.gray.200') !important;
  @apply rounded shadow-lg overflow-hidden text-gray-900;
}

.dark .cm-tooltip-autocomplete {
  background-color: black !important;
  border: 1px solid theme('colors.gray.800') !important;
  @apply rounded shadow-lg overflow-hidden text-gray-100;
}

.cm-panels {
  border-top: 1px solid theme('colors.gray.200') !important;
  background-color: theme('colors.gray.50') !important;
  color: theme('colors.gray.800') !important;
}

.cm-button {
  background-image: none !important;
  background-color: theme('colors.gray.200') !important;
  color: theme('colors.gray.700') !important;
  border: none !important;
}

.cm-textfield {
  border: 1px solid theme('colors.gray.200') !important;
}
</style>
