<script>
import frappe from 'frappejs';
import feather from 'feather-icons';
import Awesomplete from 'awesomplete';
import Autocomplete from './Autocomplete';
import Form from '../Form/Form';
import { _ } from 'frappejs/utils';

export default {
    extends: Autocomplete,
    watch: {
        value(newValue) {
            this.$refs.input.value = newValue;
        }
    },
    methods: {
        async getList(query) {
            const list = await frappe.db.getAll({
                doctype: this.getTarget(),
                filters: {
                    keywords: ["like", query]
                },
                fields: ['name'],
                limit: 50
            });

            const plusIcon = feather.icons.plus.toSvg({
                class: 'm-1',
                width: 16,
                height: 16
            });

            return list
                .map(d => ({
                    label: d.name,
                    value: d.name
                }))
                .concat({
                    label: plusIcon + ' New ' + this.getTarget(),
                    value: '__newItem'
                })
        },
        getTarget() {
            return this.docfield.target;
        },
        sort() {
            return (a, b) => {
                if (a.value === '__newitem' || b.value === '__newitem') {
                    return -1;
                }
                return a.value > b.value;
            }
        },
        filter() {
            return (suggestion, txt) => {
                if (suggestion.value === '__newItem') {
                    return true;
                }
                return Awesomplete.FILTER_CONTAINS(suggestion, txt);
            }
        },
        bindEvents() {
            const input = this.$refs.input;

            input.addEventListener('awesomplete-select', async (e) => {
                // new item action
                if (e.text && e.text.value === '__newItem') {
                    e.preventDefault();
                    const newDoc = await frappe.getNewDoc(this.getTarget());

                    this.$modal.show({
                        title: _('New {0}', _(newDoc.doctype)),
                        bodyComponent: Form,
                        bodyProps: {
                            doctype: newDoc.doctype,
                            name: newDoc.name,
                        },
                    });

                    newDoc.on('afterInsert', (data) => {
                        this.handleChange(newDoc.name);
                        this.$modal.hide();
                    });
                }
            })
        }
    }
}
</script>
