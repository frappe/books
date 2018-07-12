<script>
import Base from './Base';
export default {
    extends: Base,
    methods: {
        getInputTag() {
            return 'textarea';
        },
        getInputAttrs() {
            return {
                id: this.id,
                required: this.docfield.required,
                rows: 3,
                disabled: this.disabled
            };
        },
        getDomProps() {
            return {
                value: this.value
            }
        }
    }
}
</script>
