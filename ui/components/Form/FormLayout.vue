<template>
  <form :class="['frappe-form-layout', { 'was-validated': invalid }]">
    <div
      class="form-row"
      v-if="layoutConfig && showSection(i)"
      v-for="(section, i) in layoutConfig.sections"
      :key="i"
    >
      <div class="col" v-for="(column, j) in section.columns" :key="j">
        <frappe-control
          ref="frappe-control"
          v-for="(fieldname, k) in column.fields"
          v-if="shouldRenderField(fieldname)"
          :key="getDocField(fieldname).label"
          :docfield="getDocField(fieldname)"
          :value="$data[fieldname]"
          :doc="doc"
          :autofocus="doc.isNew() && (i === currentSection || i === 0) && j === 0 && k === 0 && !$data[fieldname]"
          @change="value => updateDoc(fieldname, value)"
        />
      </div>
    </div>
  </form>
</template>
<script>
export default {
  name: 'FormLayout',
  props: ['doc', 'fields', 'layout', 'invalid', 'currentSection'],
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
      this.updateLabels();
    });
  },
  methods: {
    updateLabels() {
      this.$refs['frappe-control'].forEach(control => {
        control.docfield.label = control.docfield.getLabel
          ? control.docfield.getLabel(this.doc)
          : control.docfield.label;
      });
    },
    getDocField(fieldname) {
      return this.fields.find(df => df.fieldname === fieldname);
    },
    shouldRenderField(fieldname) {
      let hidden;
      try {
        hidden = Boolean(this.getDocField(fieldname).hidden(this.doc));
      } catch (e) {
        hidden = Boolean(this.getDocField(fieldname).hidden) || false;
      }

      if (hidden) {
        return false;
      }

      if (fieldname === 'name' && !this.doc.isNew()) {
        return false;
      }

      return true;
    },
    updateDoc(fieldname, value) {
      this.doc.set(fieldname, value);
      this.$emit('updateDoc', {
        fieldname,
        value
      });
    },
    showSection(i) {
      if (this.layoutConfig.paginated) {
        return this.currentSection === i;
      }
      return true;
    }
  },
  computed: {
    layoutConfig() {
      let layout = this.layout;

      if (!layout) {
        const fields = this.fields.map(df => df.fieldname);
        layout = [
          {
            columns: [{ fields }]
          }
        ];
      }

      if (Array.isArray(layout)) {
        layout = {
          sections: layout
        };
      }
      return layout;
    }
  }
};
</script>
