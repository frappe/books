<template>
    <keep-alive>
        <div class="frappe-list">
            <list-actions :doctype="doctype" @new="newDoc"></list-actions>
            <ul class="list-group">
                <list-item v-for="doc of data" :key="doc.name"
                    :id="doc.name" :isActive="doc.name === $route.params.name"
                    @click.native="openForm(doc.name)"
                    @keypress.native="selectAboveListItem"
                >
                    {{ doc[meta.titleField || 'name'] }}
                </list-item>
            </ul>
        </div>
    </keep-alive>
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
        activeItem: ''
      }
  },
  computed: {
      meta() {
          return frappe.getMeta(this.doctype);
      }
  },
  async mounted() {
    const data = await frappe.db.getAll({
      doctype: this.doctype,
      fields: ['name', ...this.meta.keywordFields]
    });

    this.data = data;
  },
  methods: {
      async newDoc() {
          let doc = await frappe.getNewDoc(this.doctype);
          this.$router.push(`/edit/${this.doctype}/${doc.name}`);
      },
      openForm(name) {
          this.activeItem = name;
          this.$router.push(`/edit/${this.doctype}/${name}`);
      },
      selectAboveListItem(index) {
          console.log(index);
        //   this.openForm(this.data[index - 1].name);
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
