<script>
import Awesomplete from 'awesomplete';
import Data from './Data';

export default {
  extends: Data,
  data() {
    return {
      awesomplete: null
    }
  },
  mounted() {
    this.setupAwesomplete();
    this.awesomplete.container.classList.add('form-control');
    this.awesomplete.ul.classList.add('dropdown-menu');
  },
  methods: {
    getInputListeners() {
      return {
        input: e => {
          this.updateList(e.target.value);
        },
        'awesomplete-select': e => {
          const value = e.text.value;
          this.handleChange(value);
        },
        focus: async e => {
          await this.updateList();
          this.awesomplete.evaluate();
          this.awesomplete.open();
        }
      }
    },
    async updateList(value) {
      this.awesomplete.list = await this.getList(value);
    },
    getList(text) {
      return this.docfield.getList(text);
    },
    setupAwesomplete() {
      const input = this.$refs.input;
      this.awesomplete = new Awesomplete(input, {
        minChars: 0,
        maxItems: 99,
        sort: this.sort(),
        filter: this.filter(),
        item: (text, input) => {
          const li = document.createElement('li');
          li.classList.add('dropdown-item');
          li.classList.add('d-flex');
          li.classList.add('align-items-center');
          li.innerHTML = text.label;

          return li;
        }
      });
      this.bindEvents();
    },
    bindEvents() {
    },
    sort() {
      // return a function that handles sorting of items
    },
    filter() {
      // return a function that filters list suggestions based on input
      return Awesomplete.FILTER_CONTAINS
    }
  }
};
</script>
<style lang="scss">
@import "../../styles/variables";
@import "~awesomplete/awesomplete.base";

.awesomplete {
  padding: 0;
  border: none;

  & > ul {
    padding: $dropdown-padding-y 0;
  }

  .dropdown-menu:not([hidden]) {
    display: block;
  }

  .dropdown-item[aria-selected="true"] {
    background-color: $dropdown-link-hover-bg;
  }
}
</style>
