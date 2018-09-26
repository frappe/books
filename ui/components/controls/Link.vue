<script>
import frappe from 'frappejs';
import feather from 'feather-icons';
import Autocomplete from './Autocomplete';
import FeatherIcon from 'frappejs/ui/components/FeatherIcon';
import Form from '../Form/Form';
import { _ } from 'frappejs/utils';

export default {
  extends: Autocomplete,
  watch: {
    value(newValue) {
      this.$refs.input.value = newValue;
    }
  },
  methods: {
    async getList(query) {
      const list = await frappe.db.getAll({
        doctype: this.getTarget(),
        filters: query
          ? {
              keywords: ['like', query]
            }
          : null,
        fields: ['name'],
        limit: 50
      });

      const plusIcon = feather.icons.plus.toSvg({
        class: 'm-1',
        width: 16,
        height: 16
      });

      return list
        .map(d => ({
          label: d.name,
          value: d.name
        }))
        .concat({
          label: plusIcon + ' New ' + this.getTarget(),
          value: '__newItem'
        });
    },
    getChildrenElement(h) {
      return [
        this.onlyInput ? null : this.getLabelElement(h),
        this.getInputGroupElement(h),
        this.getDropdownElement(h)
      ];
    },
    getInputGroupElement(h) {
      return h(
        'div',
        {
          class: ['input-group']
        },
        [
          this.getInputElement(h),
          h(
            'div',
            {
              class: ['input-group-append']
            },
            [this.getFollowLink(h)]
          )
        ]
      );
    },
    getFollowLink(h) {
      const doctype = this.getTarget();
      const name = this.value;

      if (!name) {
        return null;
      }

      const arrow = h(FeatherIcon, {
        props: {
          name: 'arrow-right'
        },
        class: ['text-muted'],
        style: {
          height: '16px'
        }
      });

      return h(
        'button',
        {
          class: ['btn btn-sm btn-outline-light border d-flex'],
          attrs: {
            type: 'button'
          },
          on: {
            click: () => {
              this.$router.push(`/edit/${doctype}/${name}`);
            }
          }
        },
        [arrow]
      );
    },
    getTarget() {
      return this.docfield.target;
    },
    sort() {
      return (a, b) => {
        a = a.toLowerCase();
        b = b.toLowerCase();

        if (a.value === '__newItem') {
          return 1;
        }
        if (b.value === '___newItem') {
          return -1;
        }
        if (a.value === b.value) {
          return 0;
        }
        if (a.value < b.value) {
          return -1;
        }
        if (a.value > b.value) {
          return 1;
        }
      };
    },
    filter() {
      return (suggestion, txt) => {
        if (suggestion.value === '__newItem') {
          return true;
        }
      };
    },
    onItemClick(item) {
      if (item.value === '__newItem') {
        this.openFormModal();
      } else {
        this.handleChange(item.value);
      }
    },
    async openFormModal() {
      const input = this.$refs.input;
      const newDoc = await frappe.getNewDoc(this.getTarget());
      this.$formModal.open(newDoc, {
        defaultValues: {
          name: input.value !== '__newItem' ? input.value : null
        },
        onClose: () => {
          // if new doc was not created
          // then reset the input value
          if (this.value === '__newItem') {
            this.handleChange('');
          }
        }
      });

      newDoc.on('afterInsert', data => {
        // if new doc was created
        // then set the name of the doc in input
        this.handleChange(newDoc.name);
        this.$formModal.close();
      });
    }
  }
};
</script>
