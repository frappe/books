<script>
import Base from './Base';
export default {
    extends: Base,
    methods: {
        getInputTag() {
            return 'select';
        },
        getInputAttrs() {
            return {
                id: this.id
            };
        },
        getInputChildren(h) {
            return this.docfield.options.map(option =>
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
        }
    }
}
</script>
