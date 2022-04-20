<template>
  <FormControl
    :df="languageDf"
    :value="value"
    @change="(v) => setLanguageMap(v, dontReload)"
    :input-class="'focus:outline-none rounded ' + inputClass"
  />
</template>
<script>
import { DEFAULT_LANGUAGE } from 'frappe/utils/consts';
import config from 'src/config';
import { languageCodeMap } from 'src/languageCodeMap';
import { setLanguageMap } from 'src/utils';
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
      return config.get('language') ?? DEFAULT_LANGUAGE;
    },
    languageDf() {
      languageCodeMap;
      return {
        fieldname: 'language',
        label: this.t`Language`,
        fieldtype: 'Select',
        options: Object.keys(languageCodeMap),
        default: config.get('language') ?? DEFAULT_LANGUAGE,
        description: this.t`Set the display language.`,
      };
    },
  },
};
</script>
