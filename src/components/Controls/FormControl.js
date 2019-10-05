import Data from './Data';
import Select from './Select';

export default {
  name: 'FormControl',
  render(h) {
    let controls = {
      Data,
      Select
    };
    let { df } = this.$attrs;
    return h(controls[df.fieldtype] || Data, {
      props: this.$attrs,
      on: this.$listeners,
      ref: 'control'
    });
  },
  methods: {
    focus() {
      this.$refs.control.focus();
    }
  }
};
