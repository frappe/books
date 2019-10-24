<template>
  <div class="border-t">
    <div class="grid border-b text-xs" style="grid-template-columns: 1fr 1fr" v-for="df in fields">
      <div class="py-2 pl-4 text-gray-600 flex items-center">{{ df.label }}</div>
      <div class="py-2 pr-4">
        <FormControl
          size="small"
          :df="df"
          :value="doc[df.fieldname]"
          @change="value => onChange(df, value)"
        />
      </div>
    </div>
  </div>
</template>
<script>
import FormControl from '@/components/Controls/FormControl';

export default {
  name: 'TwoColumnForm',
  props: ['doc', 'fields', 'autosave'],
  provide() {
    return {
      doctype: this.doc.doctype,
      name: this.doc.name
    }
  },
  components: {
    FormControl
  },
  methods: {
    onChange(df, value) {
      this.doc.set(df.fieldname, value);
      if (this.autosave) {
        this.doc.update()
      }
    }
  }
}
</script>
