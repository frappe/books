<template>
    <form class="frappe-form-layout p-3">
        <frappe-control
          v-for="docfield in fields"
          :key="docfield.fieldname"
          :docfield="docfield"
          :value="$data[docfield.fieldname]"
          @change="$emit('field-change', docfield.fieldname, $event)"
        />
    </form>
</template>
<script>
import FrappeControl from './controls/FrappeControl'

export default {
    name: 'FormLayout',
    props: ['doc', 'fields'],
    data() {
        const dataObj = {};
        for (let field of this.fields) {
            dataObj[field.fieldname] = this.doc[field.fieldname];
        }
        return dataObj;
    },
    created() {
        this.doc.on('change', ({ doc, fieldname }) => {
            this[fieldname] = doc[fieldname];
        });
    },
    components: {
        FrappeControl
    }
}
</script>
