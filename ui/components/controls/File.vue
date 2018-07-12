<script>
import Base from './Base';

export default {
  extends: Base,
  computed: {
    inputClass() {
      return ['d-none'];
    }
  },
  methods: {
    getWrapperElement(h) {
      let fileName = 'Choose a file..';

      if (this.$refs.input && this.$refs.input.files.length) {
        fileName = this.$refs.input.files[0].name;
      }

      const fileButton = h('button', {
        class: ['btn btn-outline-secondary btn-block'],
        domProps: {
          textContent: fileName
        },
        on: {
          click: () => this.$refs.input.click()
        }
      });

      return h('div', {
        class: ['form-group', ...this.wrapperClass],
        attrs: {
            'data-fieldname': this.docfield.fieldname
        }
      }, [this.getLabelElement(h), this.getInputElement(h), fileButton]);
    },
    getInputAttrs() {
      return {
        id: this.id,
        type: 'file',
        value: this.value,
        required: this.docfield.required,
        disabled: this.disabled
      }
    }
  }
}
</script>
