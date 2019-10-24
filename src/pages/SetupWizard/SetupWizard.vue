<template>
  <div class="py-10 flex-1 bg-white">
    <div class="px-12">
      <h1 class="text-2xl font-semibold">{{ _('Setup your organization') }}</h1>
      <p class="text-gray-600">{{ _('These settings can be changed later') }}</p>
    </div>
    <div class="px-8 mt-5">
      <div class="border-t">
        <div
          class="grid border-b text-xs"
          style="grid-template-columns: 1fr 2fr"
          v-for="df in fields"
        >
          <div class="py-2 pl-4 text-gray-600 flex items-center">{{ df.label }}</div>
          <div class="py-2 pr-4">
            <FormControl
              size="small"
              :df="df"
              :value="doc[df.fieldname]"
              @change="value => doc.set(df.fieldname, value)"
            />
          </div>
        </div>
      </div>
    </div>
    <div class="px-8 flex justify-end mt-5">
      <Button @click="submit" type="primary" class="text-white text-sm">{{ _('Next') }}</Button>
    </div>
  </div>
</template>
<script>
import frappe from 'frappejs';
import FormControl from '@/components/Controls/FormControl';
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
    FormControl,
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
