<template>
    <form :class="['frappe-form-layout p-3', { 'was-validated': invalid }]">
        <div class="row" v-if="layout" v-for="(section, i) in layout" :key="i">
            <div class="col" v-for="(column, j) in section.columns" :key="j">
                <frappe-control
                    v-for="fieldname in column.fields"
                    :key="fieldname"
                    :docfield="getDocField(fieldname)"
                    :value="$data[fieldname]"
                    @change="value => updateDoc(docfield.fieldname, value)"
                />
            </div>
        </div>
        <div v-if="!layout">
            <frappe-control
                v-for="docfield in fields"
                :key="docfield.fieldname"
                :docfield="docfield"
                :value="$data[docfield.fieldname]"
                @change="value => updateDoc(docfield.fieldname, value)"
            />
        </div>
    </form>
</template>
<script>
import FrappeControl from './controls/FrappeControl';

export default {
  name: 'FormLayout',
  props: ['doc', 'fields', 'layout', 'invalid'],
  data() {
    const dataObj = {};
    for (let df of this.fields) {
      dataObj[df.fieldname] = this.doc[df.fieldname];

      if (df.fieldtype === 'Table' && !dataObj[df.fieldname]) {
        dataObj[df.fieldname] = [];
      }
    }
    return dataObj;
  },
  created() {
    this.doc.on('change', ({ doc, fieldname }) => {
      if (fieldname) {
        // update value
        this[fieldname] = doc[fieldname];
      } else {
        // update all values
        this.fields.forEach(df => {
          this[df.fieldname] = doc[df.fieldname];
        });
      }
    });
  },
  methods: {
    getDocField(fieldname) {
      return this.fields.find(df => df.fieldname === fieldname);
    },
    updateDoc(fieldname, value) {
      this.doc.set(fieldname, value);
    }
  },
  components: {
    FrappeControl
  }
};
</script>
