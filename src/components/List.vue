<template>
        <div class="frappe-list">
            <list-actions
              :doctype="doctype"
              :showDelete="checkList.length"
              @new="newDoc"
              @delete="deleteCheckedItems"
            />
            <ul class="list-group">
                <list-item v-for="doc of data" :key="doc.name"
                    :id="doc.name"
                    :isActive="doc.name === $route.params.name"
                    :isChecked="isChecked(doc.name)"
                    @clickItem="openForm(doc.name)"
                    @checkItem="toggleCheck(doc.name)"
                >
                    {{ doc[meta.titleField || 'name'] }}
                </list-item>
            </ul>
        </div>
</template>
<script>
import frappe from 'frappejs';
import ListActions from './ListActions';
import ListItem from './ListItem';

export default {
  name: 'List',
  props: ['doctype'],
  components: {
      ListActions,
      ListItem
  },
  data() {
      return {
        data: [],
        checkList: [],
        activeItem: ''
      }
  },
  computed: {
      meta() {
          return frappe.getMeta(this.doctype);
      }
  },
  created() {
    frappe.db.on(`change:${this.doctype}`, () => {
      this.updateList();
    });
  },
  mounted() {
    this.updateList();
  },
  methods: {
    async newDoc() {
        let doc = await frappe.getNewDoc(this.doctype);
        this.$router.push(`/edit/${this.doctype}/${doc.name}`);
    },
    async updateList() {
      const data = await frappe.db.getAll({
      doctype: this.doctype,
      fields: ['name', ...this.meta.keywordFields, this.meta.titleField]
      });

      this.data = data;
    },
    openForm(name) {
        this.activeItem = name;
        this.$router.push(`/edit/${this.doctype}/${name}`);
    },
    async deleteCheckedItems() {
      await frappe.db.deleteMany(this.doctype, this.checkList);
      this.checkList = [];
    },
    toggleCheck(name) {
      if (this.checkList.includes(name)) {
          this.checkList = this.checkList.filter(docname => docname !== name);
      } else {
          this.checkList = this.checkList.concat(name);
      }
    },
    isChecked(name) {
      return this.checkList.includes(name);
    }
  }
}
</script>
<style lang="scss" scoped>
@import "../styles/variables";

.list-group-item {
    border-left: none;
    border-right: none;
    border-radius: 0;
}

.list-group-item:not(.active):hover {
    background-color: $light;
}
</style>
