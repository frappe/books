<template>
  <AutoComplete
    :df="languageDf"
    :value="value"
    @change="onChange"
    :border="true"
    input-class="rounded py-1.5"
  />
</template>
<script lang="ts">
import { DEFAULT_LANGUAGE } from 'fyo/utils/consts';
import { OptionField } from 'schemas/types';
import { fyo } from 'src/initFyo';
import { languageCodeMap, setLanguageMap } from 'src/utils/language';
import { defineComponent } from 'vue';
import AutoComplete from './AutoComplete.vue';

export default defineComponent({
  props: {
    dontReload: {
      type: Boolean,
      default: false,
    },
  },
  components: { AutoComplete },
  methods: {
    onChange(value: unknown) {
      if (typeof value !== 'string') {
        return;
      }

      if (languageCodeMap[value] === undefined) {
        return;
      }

      setLanguageMap(value, this.dontReload);
    },
  },
  computed: {
    value() {
      return fyo.config.get('language') ?? DEFAULT_LANGUAGE;
    },
    languageDf(): OptionField {
      const preset = fyo.config.get('language');
      let language = DEFAULT_LANGUAGE;
      if (typeof preset === 'string') {
        language = preset;
      }

      return {
        fieldname: 'language',
        label: this.t`Language`,
        fieldtype: 'AutoComplete',
        options: Object.keys(languageCodeMap).map((value) => ({
          label: value,
          value,
        })),
        default: language,
        description: this.t`Set the display language.`,
      };
    },
  },
});
</script>
