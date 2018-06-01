<script>
import Base from './Base';
export default {
    extends: Base,
    methods: {
        getInputElement(h) {
            const options = this.docfield.options.map(option =>
                h('option', {
                    attrs: {
                        key: option,
                        selected: option === this.value
                    },
                    domProps: {
                        textContent: option
                    }
                })
            );

            return h('select', {
                class: ['form-control'],
                attrs: {
                    id: this.id
                },
                on: {
                    change: (e) => {
                        this.$emit('change', e.target.value)
                    }
                },
                ref: 'input'
            }, options)
        }
    }
}
</script>
