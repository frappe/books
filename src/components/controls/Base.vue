<script>
export default {
    render(h) {
        return this.getWrapperElement(h);
    },
    props: ['docfield', 'value'],
    computed: {
        id() {
            return this.docfield.fieldname + '-'
              + document.querySelectorAll(`[data-fieldname="${this.docfield.fieldname}"]`).length;
        }
    },
    methods: {
        getWrapperElement(h) {
            return h('div', {
                class: ['form-group'],
                attrs: {
                    'data-fieldname': this.docfield.fieldname
                }
            }, [this.getLabelElement(h), this.getInputElement(h)]);
        },
        getLabelElement(h) {
            return h('label', {
                attrs: {
                    for: this.id
                },
                domProps: {
                    textContent: this.docfield.label
                }
            });
        },
        getInputElement(h) {
            return h('input', {
                class: ['form-control'],
                attrs: this.getInputAttrs(),
                on: {
                    change: (e) => {
                        this.$emit('change', e.target.value)
                    }
                },
                ref: 'input'
            })
        },
        getInputAttrs() {
            return {
                id: this.id,
                type: 'text',
                placeholder: '',
                value: this.value
            }
        }
    }
}
</script>
