<script>
export default {
  render(h) {
    if (this.onlyInput) {
      return this.getInputElement(h);
    }
    return this.getWrapperElement(h);
  },
  data() {
    return {
      label: this.docfield.label
    };
  },
  props: {
    docfield: Object,
    value: [String, Number, Array, FileList],
    onlyInput: {
      type: Boolean,
      default: false
    },
    disabled: Boolean,
    autofocus: Boolean,
    doc: Object
  },
  mounted() {
    if (this.autofocus) {
      this.$refs.input.focus();
    }
  },
  computed: {
    id() {
      return (
        this.docfield.fieldname +
        '-' +
        document.querySelectorAll(
          `[data-fieldname="${this.docfield.fieldname}"]`
        ).length
      );
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
      return h(
        'div',
        {
          class: [
            'form-group',
            this.onlyInput ? 'mb-0' : '',
            ...this.wrapperClass
          ],
          attrs: {
            'data-fieldname': this.docfield.fieldname,
            'data-fieldtype': this.docfield.fieldtype
          }
        },
        this.getChildrenElement(h)
      );
    },
    getChildrenElement(h) {
      return [
        this.getLabelElement(h),
        this.getInputElement(h),
        this.getDescriptionElement(h)
      ];
    },
    getLabelElement(h) {
      return h('label', {
        class: [this.labelClass, 'text-muted'],
        attrs: {
          for: this.id
        },
        domProps: {
          textContent: this.label
        }
      });
    },
    getDescriptionElement(h) {
      return h('small', {
        class: ['form-text', 'text-muted'],
        domProps: {
          textContent: this.docfield.description || ''
        }
      });
    },
    getInputElement(h) {
      return h(
        this.getInputTag(),
        {
          class: this.getInputClass(),
          attrs: this.getInputAttrs(),
          on: this.getInputListeners(),
          domProps: this.getDomProps(),
          ref: 'input'
        },
        this.getInputChildren(h)
      );
    },
    getInputTag() {
      return 'input';
    },
    getFormControlSize() {
      return this.docfield.size === 'small'
        ? 'form-control-sm'
        : this.size === 'large'
        ? 'form-control-lg'
        : '';
    },
    getInputClass() {
      return ['form-control', this.getFormControlSize(), ...this.inputClass];
    },
    getInputAttrs() {
      return {
        id: this.id,
        type: 'text',
        placeholder: this.docfield.placeholder || '',
        value: this.value,
        required: this.docfield.required,
        disabled: this.disabled
      };
    },
    getInputListeners() {
      return {
        change: e => {
          this.handleChange(e.target.value);
        }
      };
    },
    getInputChildren() {
      return null;
    },
    getDomProps() {
      return null;
    },
    async handleChange(value) {
      value = this.parse(value);
      const isValid = await this.validate(value);
      this.$refs.input.setCustomValidity(isValid === false ? 'error' : '');
      this.$emit('change', value);
    },
    getValueFromInput(e) {},
    validate() {
      return true;
    },
    parse(value) {
      return value;
    }
  }
};
</script>
