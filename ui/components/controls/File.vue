<script>
import Base from './Base';

export default {
  extends: Base,
  methods: {
    getWrapperElement(h) {
      let fileName = this.docfield.placeholder || this._('Choose a file..');
      let filePath = null;

      if (this.value && typeof this.value === 'string') {
        filePath = this.value;
      }
      else if (this.$refs.input && this.$refs.input.files.length) {
        fileName = this.$refs.input.files[0].name;
      }

      const fileLink = h('a', {
        attrs: {
          href: filePath,
          target: '_blank'
        },
        domProps: {
          textContent: this._('View File')
        }
      });

      const helpText = h('small', {
        class: 'form-text text-muted'
      }, [fileLink]);

      const fileNameLabel = h('label', {
        class: ['custom-file-label'],
        domProps: {
          textContent: filePath || fileName
        }
      });

      const fileInputWrapper = h('div', {
          class: ['custom-file']
        },
        [this.getInputElement(h), fileNameLabel, filePath ? helpText : null]
      );

      return h(
        'div',
        {
          class: ['form-group', ...this.wrapperClass],
          attrs: {
            'data-fieldname': this.docfield.fieldname
          }
        },
        [this.getLabelElement(h), fileInputWrapper]
      );
    },
    getInputAttrs() {
      return {
        id: this.id,
        type: 'file',
        value: this.value,
        required: this.docfield.required,
        disabled: this.disabled,
        webkitdirectory: this.docfield.directory,
        directory: this.docfield.directory,
        accept: (this.docfield.filetypes || []).join(',')
      };
    },
    getInputClass() {
      return 'custom-file-input';
    },
    getInputListeners() {
      return {
        change: e => {
          this.handleChange(e.target.files);
        }
      };
    }
  }
};
</script>
