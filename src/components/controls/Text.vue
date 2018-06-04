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
                rows: 3
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
