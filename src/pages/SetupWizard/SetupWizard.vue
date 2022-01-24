<template>
  <div
    class="flex-1 py-10 bg-white"
    :class="{
      'window-drag': platform !== 'Windows',
    }"
  >
    <div class="px-12">
      <h1 class="text-2xl font-semibold">{{ t('Setup your organization') }}</h1>
    </div>
    <div class="px-8 mt-5 window-no-drag" v-if="doc">
      <div class="flex items-center px-6 py-5 mb-4 border bg-brand rounded-xl">
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
            <template slot="target">
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
            <template slot="content">
              <div class="p-2 text-sm">
                {{ emailError }}
              </div>
            </template>
          </Popover>
        </div>
      </div>
      <TwoColumnForm :fields="fields" :doc="doc" />
    </div>
    <div class="flex justify-between px-8 mt-5 window-no-drag">
      <Button class="text-sm text-grey-900" @click="$emit('setup-canceled')"
        >Cancel</Button
      >
      <Button
        @click="submit"
        type="primary"
        class="text-sm text-white"
        :disabled="!valuesFilled || loading"
      >
        {{ buttonText }}
      </Button>
    </div>
  </div>
</template>
<script>
import frappe from 'frappe';
import TwoColumnForm from '@/components/TwoColumnForm';
import FormControl from '@/components/Controls/FormControl';
import Button from '@/components/Button';
import setupCompany from './setupCompany';
import Popover from '@/components/Popover';
import config from '@/config';
import path from 'path';
import fs from 'fs';
import { purgeCache, connectToLocalDatabase } from '@/initialization';
import { showMessageDialog } from '@/utils';
import {
  handleErrorWithDialog,
  getErrorMessage,
  showErrorDialog,
} from '../../errorHandling';

export default {
  name: 'SetupWizard',
  data() {
    return {
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
    Button,
    Popover,
  },
  async mounted() {
    this.doc = await frappe.newDoc({ doctype: 'SetupWizard' });
    this.doc.on('change', () => {
      this.valuesFilled = this.allValuesFilled();
    });
  },
  methods: {
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
        showMessageDialog({ message: this.t('Please fill all values') });
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

      purgeCache();

      const { connectionSuccess, reason } = await connectToLocalDatabase(
        filePath
      );

      if (connectionSuccess) {
        await setupCompany(this.doc);
        this.$emit('setup-complete');
      } else {
        const title = this.t`DB Connection Error`;
        const content = this.t`reason: ${reason}, filePath: ${filePath}`;
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
      return this.loading ? this.t('Setting Up...') : this.t('Submit');
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
