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
  methods: {
    getInputListeners() {
      return {
        input: e => {
          this.updateList(e.target.value);
        },
        keydown: e => {
          if (e.keyCode === 38) {
            // up
            this.highlightedItem -= 1;
          }
          if (e.keyCode === 40) {
            // down
            this.highlightedItem += 1;
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
    getChildrenElement(h) {
      return [
        this.getLabelElement(h),
        this.getInputElement(h),
        this.getDropdownElement(h)
      ];
    },
    getDropdownElement(h) {
      return h('div', {
        class: ['dropdown-menu w-100', this.popupOpen ? 'show' : '']
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
