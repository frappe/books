<script>
import Data from './Data';

export default {
  extends: Data,
  data() {
    return {
      popupOpen: false,
      popupItems: [],
      highlightedItem: -1
    }
  },
  render(h) {
      return this.getWrapperElement(h);
  },
  watch: {
    // prop change does not change the value of input
    // this only happens for Autocomplete
    value(newValue) {
      this.$refs.input.value = newValue;
    }
  },
  methods: {
    getInputListeners() {
      return {
        input: e => {
          this.updateList(e.target.value);
        },
        keydown: e => {
          if (e.keyCode === 38) {
            // up
            this.highlightAboveItem();
          }
          if (e.keyCode === 40) {
            // down
            this.highlightBelowItem();
          }
          if (e.keyCode === 13) {
            if (this.highlightedItem > -1) {
              this.onItemClick(this.popupItems[this.highlightedItem]);
              this.popupOpen = false;
            }
          }
        },
        focus: async e => {
          await this.updateList();
        },
        blur: () => {
          setTimeout(() => {
            this.popupOpen = false;
          }, 200);
        }
      }
    },
    highlightBelowItem() {
      this.highlightedItem += 1;
      if (this.highlightedItem > this.popupItems.length - 1) {
        this.highlightedItem = this.popupItems.length - 1;
      }

      this.scrollToItem(this.highlightedItem);
    },
    highlightAboveItem() {
      this.highlightedItem -= 1;
      if (this.highlightedItem < 0) {
        this.highlightedItem = 0;
      }

      this.scrollToItem(this.highlightedItem);
    },
    getChildrenElement(h) {
      return [
        this.onlyInput ? null : this.getLabelElement(h),
        this.getInputElement(h),
        this.getDropdownElement(h)
      ];
    },
    getDropdownElement(h) {
      return h('div', {
        class: ['dropdown-menu w-100', this.popupOpen ? 'show' : ''],
        ref: 'dropdown-menu'
      }, this.getDropdownItems(h));
    },
    getDropdownItems(h) {
      return this.popupItems.map((item, i) => {
        return h('a', {
          class: ['dropdown-item', this.highlightedItem === i ? 'active text-dark' : ''],
          attrs: {
            href: '#',
            'data-value': item.value
          },
          ref: i,
          on: {
            click: e => {
              e.preventDefault();
              this.onItemClick(item);
              this.popupOpen = false;
            }
          },
          domProps: {
            innerHTML: item.label
          }
        })
      });
    },
    onItemClick(item) {
      this.handleChange(item.value);
    },
    scrollToItem(i) {
      const scrollTo = this.$refs[i].offsetTop - 5;
      this.$refs['dropdown-menu'].scrollTop = scrollTo;
    },
    async updateList(keyword) {
      this.popupItems = await this.getList(keyword);
      this.popupOpen = this.popupItems.length > 0;
    },
    async getList(text='') {
      let list = await this.docfield.getList(text);
      list = list.map(item => {
        if (typeof item === 'string') {
          return {
            label: item,
            value: item
          }
        }
        return item;
      });

      return list.filter(item => {
        const string = (item.label + ' ' +  item.value).toLowerCase();
        return string.includes(text.toLowerCase());
      });
    }
  }
};
</script>
<style>
.form-group[data-fieldtype="Link"] .dropdown-menu {
  max-height: 200px;
  overflow: auto;
}
</style>
