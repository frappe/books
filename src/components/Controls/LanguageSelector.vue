<template>
  <FormControl
    :df="languageDf"
    :value="value"
    @change="(v) => setLanguageMap(v, dontReload)"
    :input-class="'focus:outline-none rounded ' + inputClass"
  />
</template>
<script>
import { DEFAULT_LANGUAGE } from 'fyo/utils/consts';
import { fyo } from 'src/initFyo';
import { setLanguageMap } from 'src/utils';
import { languageCodeMap } from 'src/utils/language';
import FormControl from './FormControl';

export default {
  methods: {
    setLanguageMap,
  },
  props: {
    inputClass: {
      type: String,
      default:
        'bg-gray-100 active:bg-gray-200 focus:bg-gray-200 px-3 py-2 text-base',
    },
    dontReload: {
      type: Boolean,
      default: false,
    },
  },
  components: { FormControl },
  computed: {
    value() {
      return fyo.config.get('language') ?? DEFAULT_LANGUAGE;
    },
    languageDf() {
      return {
        fieldname: 'language',
        label: this.t`Language`,
        fieldtype: 'Select',
        options: Object.keys(languageCodeMap),
        default: fyo.config.get('language') ?? DEFAULT_LANGUAGE,
        description: this.t`Set the display language.`,
      };
    },
  },
};
</script>
