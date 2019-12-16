<template>
  <div class="py-10 flex-1 bg-white window-drag">
    <div class="px-12">
      <h1 class="text-2xl font-semibold">{{ _('Setup your organization') }}</h1>
      <p class="text-gray-600">
        {{ _('These settings can be changed later') }}
      </p>
    </div>
    <div class="px-8 mt-5 window-no-drag">
      <div class="flex items-center border bg-brand rounded-xl px-6 py-5 mb-4">
        <FormControl
          :df="meta.getField('companyLogo')"
          :value="doc.companyLogo"
          @change="value => doc.set('companyLogo', value)"
        />
        <div class="ml-2">
          <FormControl
            ref="companyField"
            :df="meta.getField('companyName')"
            :value="doc.companyName"
            @change="value => doc.set('companyName', value)"
            :input-class="
              classes => [
                'bg-transparent font-semibold text-xl text-white placeholder-blue-200 focus:outline-none focus:bg-blue-600 px-3 rounded py-1'
              ]
            "
            :autofocus="true"
          />
          <FormControl
            :df="meta.getField('email')"
            :value="doc.email"
            @change="value => doc.set('email', value)"
            :input-class="
              classes => [
                'text-base bg-transparent text-white placeholder-blue-200 focus:bg-blue-600 focus:outline-none rounded px-3 py-1'
              ]
            "
          />
        </div>
      </div>
      <TwoColumnForm :fields="fields" :doc="doc" />
    </div>
    <div class="px-8 flex justify-end mt-5 window-no-drag">
      <Button
        @click="submit"
        type="primary"
        class="text-white text-sm"
        :disabled="loading"
      >
        {{ buttonText }}
      </Button>
    </div>
  </div>
</template>
<script>
import frappe from 'frappejs';
import TwoColumnForm from '@/components/TwoColumnForm';
import FormControl from '@/components/Controls/FormControl';

import Button from '@/components/Button';

export default {
  name: 'SetupWizard',
  data() {
    return {
      meta: frappe.getMeta('SetupWizard'),
      loading: false,
      doc: {}
    };
  },
  provide() {
    return {
      doctype: 'SetupWizard',
      name: 'SetupWizard'
    };
  },
  components: {
    TwoColumnForm,
    FormControl,
    Button
  },
  async beforeMount() {
    this.doc = await frappe.newDoc({ doctype: 'SetupWizard' });
  },
  methods: {
    async submit() {
      try {
        this.loading = true;
        frappe.events.trigger('SetupWizard:setup-complete', this.doc);
      } catch (e) {
        this.loading = false;
        console.error(e);
      }
    }
  },
  computed: {
    fields() {
      return this.meta.getQuickEditFields();
    },
    buttonText() {
      return this.loading ? this._('Setting Up...') : this._('Next');
    }
  }
};
</script>
