<template>
    <form class="frappe-form-layout p-3">
        <div class="row" v-if="layout" v-for="(section, i) in layout" :key="i">
            <div class="col" v-for="(column, j) in section.columns" :key="j">
                <frappe-control
                    v-for="fieldname in column.fields"
                    :key="fieldname"
                    :docfield="getDocField(fieldname)"
                    :value="$data[fieldname]"
                    @change="$emit('field-change', fieldname, $event)"
                />
            </div>
        </div>
        <div v-if="!layout">
            <frappe-control
                v-for="docfield in fields"
                :key="docfield.fieldname"
                :docfield="docfield"
                :value="$data[docfield.fieldname]"
                @change="$emit('field-change', docfield.fieldname, $event)"
            />
        </div>
    </form>
</template>
<script>
import FrappeControl from './controls/FrappeControl'

export default {
    name: 'FormLayout',
    props: ['doc', 'fields', 'layout'],
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
    methods: {
        getDocField(fieldname) {
            return this.fields.find(df => df.fieldname === fieldname);
        }
    },
    components: {
        FrappeControl
    }
}
</script>
