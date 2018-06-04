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
        },
        inputClass() {
            return [];
        },
        wrapperClass() {
            return [];
        },
        labelClass() {
            return [];
        }
    },
    methods: {
        getWrapperElement(h) {
            return h('div', {
                class: ['form-group', ...this.wrapperClass],
                attrs: {
                    'data-fieldname': this.docfield.fieldname
                }
            }, [this.getLabelElement(h), this.getInputElement(h)]);
        },
        getLabelElement(h) {
            return h('label', {
                class: this.labelClass,
                attrs: {
                    for: this.id
                },
                domProps: {
                    textContent: this.docfield.label
                }
            });
        },
        getInputElement(h) {
            return h(this.getInputTag(), {
                class: this.getInputClass(),
                attrs: this.getInputAttrs(),
                on: this.getInputListeners(),
                domProps: this.getDomProps(),
                ref: 'input'
            }, this.getInputChildren(h));
        },
        getInputTag() {
            return 'input';
        },
        getInputClass() {
            return ['form-control', ...this.inputClass];
        },
        getInputAttrs() {
            return {
                id: this.id,
                type: 'text',
                placeholder: '',
                value: this.value
            }
        },
        getInputListeners() {
            return {
                change: (e) => {
                    this.$emit('change', this.parseValue(e.target.value));
                }
            };
        },
        getInputChildren() {
            return null;
        },
        getDomProps() {
            return null;
        },
        parseValue(value) {
            return value;
        }
    }
}
</script>
