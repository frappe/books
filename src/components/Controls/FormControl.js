import Data from './Data';
import Select from './Select';
import Link from './Link';

export default {
  name: 'FormControl',
  render(h) {
    let controls = {
      Data,
      Select,
      Link
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
