<template>
  <div class="branch">
    <div class="branch-label px-3 py-2" @click.self="toggleChildren">
      <div class="d-flex align-items-center" @click="toggleChildren">
        <feather-icon class="mr-1" :name="iconName" v-show="iconName" />
        <span>{{ label }}</span>
        <div class="ml-auto d-flex align-items-center">
          <feather-icon v-if="balance !== ''" style="width:15px; height:15px" name="dollar-sign"/>
          <span>{{ balance }}</span>
        </div>
      </div>
    </div>
    <div :class="['branch-children', expanded ? '' : 'd-none']">
      <branch v-for="child in children" :key="child.label"
        :label="child.label"
        :balance="child.balance"
        :parentValue="child.name"
        :doctype="doctype"
      />
    </div>
  </div>
</template>
<script>
const Branch = {
  props: ['label', 'parentValue', 'doctype', 'balance'],
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
    Branch: () => Promise.resolve(Branch)
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
        fields: [this.settings.parentField, 'isGroup', 'name', 'balance'],
        orderBy: 'name',
        order: 'asc'
      });

      this.children = children.map(c => {
        c.label = c.name;
        c.balance = c.balance
        return c;
      });
    }
  }
};

export default Branch;
</script>
<style lang="scss">
@import "../../styles/variables";

.branch {
  font-size: 1rem;
}
.borderBottom {
  border-bottom: 0.1rem solid #aaaaaa;
}
.branch-label {
  border-radius: 4px;
  cursor: pointer;
}
.branch-label:hover {
  background-color: $dropdown-link-hover-bg;
}
.branch-children {
  padding-left: 2.25rem;
}
</style>
