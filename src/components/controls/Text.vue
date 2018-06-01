<script>
import Base from './Base';
export default {
    extends: Base,
    methods: {
        getInputElement(h) {
            return h('textarea', {
                class: ['form-control'],
                attrs: {
                    id: this.id,
                    rows: 3
                },
                domProps: {
                    value: this.value
                },
                on: {
                    change: (e) => {
                        this.$emit('change', e.target.value)
                    }
                },
                ref: 'input'
            });
        }
    }
}
</script>
