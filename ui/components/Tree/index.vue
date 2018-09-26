<template>
  <div class="p-3 w-50" v-if="rootNode">
    <tree-node :label="rootNode.label" :parentValue="''" :doctype="doctype" ref="rootNode"/>
  </div>
</template>
<script>
import frappe from 'frappejs';
import TreeNode from './TreeNode';
import { setTimeout } from 'timers';

export default {
  props: ['doctype'],
  components: {
    TreeNode,
  },
  data() {
    return {
      rootNode: null
    }
  },
  mounted() {
    setTimeout(() => {
      this.$refs.rootNode.find('.tree-label').click();
    }, 500);
  },
  async mounted() {
    this.settings = frappe.getMeta(this.doctype).treeSettings;
    this.rootNode = {
      label: await this.settings.getRootLabel()
    };
  },
  methods: {
    async getChildren(parentValue) {
      let filters = {
        [this.settings.parentField]: parentValue
      };

      const children = await frappe.db.getAll({
        doctype: this.doctype,
        filters,
        fields: [this.settings.parentField, 'isGroup', 'name'],
        orderBy: 'name',
        order: 'asc'
      });

      return children.map(c => {
        c.label = c.name;
        return c;
      });
    }
  }
}
</script>
