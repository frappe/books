<script>
import frappe from 'frappejs';
import feather from 'feather-icons';
import Autocomplete from './Autocomplete';

export default {
    extends: Autocomplete,
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
        }
    }
}
</script>
