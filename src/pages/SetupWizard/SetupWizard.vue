import FormControl from '@/components/Controls/FormControl'; import
LanguageSelector from '@/components/Controls/LanguageSelector.vue'; import
Popover from '@/components/Popover'; import TwoColumnForm from
'@/components/TwoColumnForm'; import config from '@/config'; import {
connectToLocalDatabase, purgeCache } from '@/initialization'; import {
IPC_MESSAGES } from '@/messages'; import { setLanguageMap, showMessageDialog }
from '@/utils'; import { ipcRenderer } from 'electron'; import frappe from
'frappe'; import fs from 'fs'; import path from 'path'; import {
getErrorMessage, handleErrorWithDialog, showErrorDialog } from
'../../errorHandling'; import setupCompany from './setupCompany'; import Slide
from './Slide.vue';
<template>
  <div>
    <Slide
      @primary-clicked="handlePrimary"
      @secondary-clicked="handleSecondary"
      v-show="index === 0"
    >
      <template #title>
        {{ t`Select your language` }}
      </template>
      <template #content>
        <div class="flex flex-col justify-center items-center h-96">
          <LanguageSelector class="w-40 mt-8" :dont-reload="true" />
          <p
            class="text-sm mt-2 hover:underline cursor-pointer text-gray-700"
            @click="openContributingTranslations"
          >
            {{ t`I can't find my language.` }}
          </p>
        </div>
      </template>
      <template #secondaryButton>
        {{ t`Cancel` }}
      </template>
      <template #primaryButton>
        {{ t`Next` }}
      </template>
    </Slide>
    <Slide
      :primary-disabled="!valuesFilled || loading"
      @primary-clicked="handlePrimary"
      @secondary-clicked="handleSecondary"
      v-show="index === 1"
    >
      <template #title>
        {{ t`Setup your organization` }}
      </template>
      <template #content>
        <div v-if="doc">
          <div
            class="flex items-center px-6 py-5 mb-4 border bg-brand rounded-xl"
          >
            <FormControl
              :df="meta.getField('companyLogo')"
              :value="doc.companyLogo"
              @change="(value) => setValue('companyLogo', value)"
            />
            <div class="ml-2">
              <FormControl
                ref="companyField"
                :df="meta.getField('companyName')"
                :value="doc.companyName"
                @change="(value) => setValue('companyName', value)"
                :input-class="
                  (classes) => [
                    'bg-transparent font-semibold text-xl text-white placeholder-blue-200 focus:outline-none focus:bg-blue-600 px-3 rounded py-1',
                  ]
                "
                :autofocus="true"
              />
              <Popover placement="auto" :show-popup="Boolean(emailError)">
                <template #target>
                  <FormControl
                    :df="meta.getField('email')"
                    :value="doc.email"
                    @change="(value) => setValue('email', value)"
                    :input-class="
                      (classes) => [
                        'text-base bg-transparent text-white placeholder-blue-200 focus:bg-blue-600 focus:outline-none rounded px-3 py-1',
                      ]
                    "
                  />
                </template>
                <template #content>
                  <div class="p-2 text-sm">
                    {{ emailError }}
                  </div>
                </template>
              </Popover>
            </div>
          </div>
          <TwoColumnForm :fields="fields" :doc="doc" />
        </div>
      </template>
      <template #secondaryButton>{{ t`Back` }}</template>
      <template #primaryButton>{{ t`Submit` }}</template>
    </Slide>
  </div>
</template>

<script>
import FormControl from '@/components/Controls/FormControl';
import LanguageSelector from '@/components/Controls/LanguageSelector.vue';
import Popover from '@/components/Popover';
import TwoColumnForm from '@/components/TwoColumnForm';
import config from '@/config';
import { connectToLocalDatabase, purgeCache } from '@/initialization';
import { IPC_MESSAGES } from 'utils/messages';
import { setLanguageMap, showMessageDialog } from '@/utils';
import { ipcRenderer } from 'electron';
import frappe from 'frappe';
import fs from 'fs';
import path from 'path';
import {
  getErrorMessage,
  handleErrorWithDialog,
  showErrorDialog,
} from '../../errorHandling';
import setupCompany from './setupCompany';
import Slide from './Slide.vue';

export default {
  name: 'SetupWizard',
  emits: ['setup-complete', 'setup-canceled'],
  data() {
    return {
      index: 0,
      doc: null,
      loading: false,
      valuesFilled: false,
      emailError: null,
    };
  },
  provide() {
    return {
      doctype: 'SetupWizard',
      name: 'SetupWizard',
    };
  },
  components: {
    TwoColumnForm,
    FormControl,
    Popover,
    Slide,
    LanguageSelector,
  },
  async mounted() {
    if (config.get('language') !== undefined) {
      this.index = 1;
    }

    this.doc = await frappe.doc.getNewDoc('SetupWizard');
    this.doc.on('change', () => {
      this.valuesFilled = this.allValuesFilled();
    });
  },
  methods: {
    openContributingTranslations() {
      ipcRenderer.send(
        IPC_MESSAGES.OPEN_EXTERNAL,
        'https://github.com/frappe/books/wiki/Contributing-Translations'
      );
    },
    handlePrimary() {
      if (this.index === 0) {
        this.index = 1;
      } else if (this.index === 1) {
        this.submit();
      }
    },
    handleSecondary() {
      if (this.index === 1) {
        this.index = 0;
      } else if (this.index === 0) {
        this.$emit('setup-canceled');
      }
    },
    async selectLanguage(value) {
      const success = await setLanguageMap(value);
      this.setValue('language', value);
    },
    setValue(fieldname, value) {
      this.emailError = null;
      this.doc.set(fieldname, value).catch((e) => {
        // set error
        if (fieldname === 'email') {
          this.emailError = getErrorMessage(e, this.doc);
        }
      });
    },
    allValuesFilled() {
      let values = this.meta.quickEditFields.map(
        (fieldname) => this.doc[fieldname]
      );
      return values.every(Boolean);
    },
    async submit() {
      if (!this.allValuesFilled()) {
        showMessageDialog({ message: this.t`Please fill all values` });
        return;
      }

      try {
        this.loading = true;
        await setupCompany(this.doc);
        this.$emit('setup-complete');
      } catch (e) {
        this.loading = false;
        if (e.type === frappe.errors.DuplicateEntryError) {
          console.log(e);
          console.log('retrying');
          await this.renameDbFileAndRerunSetup();
        } else {
          handleErrorWithDialog(e, this.doc);
        }
      }
    },
    async renameDbFileAndRerunSetup() {
      const filePath = config.get('lastSelectedFilePath');
      renameDbFile(filePath);

      await purgeCache();

      const { connectionSuccess, reason } = await connectToLocalDatabase(
        filePath
      );

      if (connectionSuccess) {
        await setupCompany(this.doc);
        this.$emit('setup-complete');
      } else {
        const title = this.t`DB Connection Error`;
        const content = `reason: ${reason}, filePath: ${filePath}`;
        await showErrorDialog(title, content);
      }
    },
  },
  computed: {
    meta() {
      return frappe.getMeta('SetupWizard');
    },
    fields() {
      return this.meta.getQuickEditFields();
    },
    buttonText() {
      return this.loading ? this.t`Setting Up...` : this.t`Submit`;
    },
  },
};

function renameDbFile(filePath) {
  const dirname = path.dirname(filePath);
  const basename = path.basename(filePath);
  const backupPath = path.join(dirname, `_${basename}`);
  if (fs.existsSync(backupPath)) {
    fs.unlinkSync(backupPath);
  }
  fs.renameSync(filePath, backupPath);
}
</script>
