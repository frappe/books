<template>
  <div class="py-10 flex-1 bg-white window-drag">
    <div class="px-12">
      <h1 class="text-2xl font-semibold">{{ _('Setup your organization') }}</h1>
      <p class="text-gray-600">
        {{ _('These settings can be changed later') }}
      </p>
    </div>
    <div class="px-8 mt-5">
      <TwoColumnForm :fields="fields" :doc="doc" />
    </div>
    <div class="px-8 flex justify-end mt-5">
      <Button @click="submit" type="primary" class="text-white text-sm">
        {{ _('Next') }}
      </Button>
    </div>
  </div>
</template>
<script>
import frappe from 'frappejs';
import TwoColumnForm from '@/components/TwoColumnForm';
import Button from '@/components/Button';

export default {
  name: 'SetupWizard',
  data() {
    return {
      meta: frappe.getMeta('SetupWizard'),
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
    Button
  },
  async beforeMount() {
    this.doc = await frappe.newDoc({ doctype: 'SetupWizard' });
  },
  methods: {
    async submit() {
      try {
        frappe.events.trigger('SetupWizard:setup-complete', this.doc);
      } catch (e) {
        console.error(e);
      }
    }
  },
  computed: {
    fields() {
      return this.meta.getQuickEditFields();
    }
  }
};
</script>
