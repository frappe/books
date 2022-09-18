<template>
  <FormControl
    :df="languageDf"
    :value="value"
    @change="onChange"
    :border="true"
    :input-class="'rounded py-1.5'"
  />
</template>
<script>
import { DEFAULT_LANGUAGE } from 'fyo/utils/consts';
import { fyo } from 'src/initFyo';
import { languageCodeMap, setLanguageMap } from 'src/utils/language';
import FormControl from './FormControl.vue';

export default {
  methods: {
    setLanguageMap,
  },
  props: {
    dontReload: {
      type: Boolean,
      default: false,
    },
  },
  components: { FormControl },
  methods: {
    onChange(value) {
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
    languageDf() {
      return {
        fieldname: 'language',
        label: this.t`Language`,
        fieldtype: 'AutoComplete',
        options: Object.keys(languageCodeMap),
        default: fyo.config.get('language') ?? DEFAULT_LANGUAGE,
        description: this.t`Set the display language.`,
      };
    },
  },
};
</script>
