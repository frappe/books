<script>
import Base from './Base';

export default {
    extends: Base,
    computed: {
        inputClass() {
            return ['text-right']
        }
    },
    methods: {
        getInputListeners() {
            return {
                change: e => {
                    this.handleChange(e.target.value);
                },
                focus: e => {
                    setTimeout(() => this.$refs.input.select(), 100);
                }
            };
        },
        validate(value) {
            return !isNaN(value);
        },
        parse(value) {
            return Number(value);
        }
    }
}
</script>
