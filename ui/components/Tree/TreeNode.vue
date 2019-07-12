<template>
  <div class="tree-node">
    <div class="tree-label px-3 py-2" @click.self="toggleChildren">
      <div class="d-flex align-items-center" @click="toggleChildren">
        <feather-icon class="mr-1" :name="iconName" v-show="iconName" />
        <span>{{ label }}</span>
      </div>
    </div>
    <div :class="['tree-children', expanded ? '' : 'd-none']">
      <tree-node v-for="child in children" :key="child.label"
        :label="child.label"
        :parentValue="child.name"
        :doctype="doctype"
      />
    </div>
  </div>
</template>
<script>
const TreeNode = {
  props: ['label', 'parentValue', 'doctype'],
  data() {
    return {
      expanded: false,
      children: null
    }
  },
  computed: {
    iconName() {
      if (this.children && this.children.length ==0) return 'chevron-right';
      return this.expanded ? 'chevron-down' : 'chevron-right';
    }
  },
  components: {
    TreeNode: () => Promise.resolve(TreeNode)
  },
  mounted() {
    this.settings = frappe.getMeta(this.doctype).treeSettings;
  },
  methods: {
    async toggleChildren() {
      await this.getChildren();
      this.expanded = !this.expanded;
    },
    async getChildren() {
      if (this.children) return;

      this.children = [];

      let filters = {
        [this.settings.parentField]: this.parentValue
      };

      const children = await frappe.db.getAll({
        doctype: this.doctype,
        filters,
        fields: [this.settings.parentField, 'isGroup', 'name'],
        orderBy: 'name',
        order: 'asc'
      });

      this.children = children.map(c => {
        c.label = c.name;
        return c;
      });
    }
  }
};

export default TreeNode;
</script>
<style lang="scss">
@import "../../styles/variables";

.tree-node {
  font-size: 1rem;
}
.tree-label {
  border-radius: 4px;
  cursor: pointer;
}
.tree-label:hover {
  background-color: $dropdown-link-hover-bg;;
}
.tree-children {
  padding-left: 2.25rem;
}
</style>
