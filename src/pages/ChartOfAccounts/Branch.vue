<template>
  <div class="branch">
    <div class="branch-label px-3 py-2" @click.self="toggleChildren">
      <div class="d-flex align-items-center" @click="toggleChildren">
        <feather-icon class="mr-1" :name="iconName" v-show="iconName" />
        <span>{{ label }}</span>
        <div class="ml-auto d-flex align-items-center" v-if="rootType != null">
          <span>
            {{ currency }}
            <span style="font-weight: 800">{{ Math.abs(computedBalance) }}</span>
            {{ creditOrDebit }}
          </span>
        </div>
      </div>
    </div>
    <div :class="['branch-children', expanded ? '' : 'd-none']">
      <branch
        v-for="child in children"
        :key="child.label"
        :label="child.label"
        :balance="child.balance"
        :parentValue="child.name"
        :doctype="doctype"
        :currency="currency"
        :rootType="child.rootType"
        @updateBalance="updateBalance"
      />
    </div>
  </div>
</template>
<script>
const Branch = {
  props: ['label', 'parentValue', 'doctype', 'balance', 'currency', 'rootType'],
  data() {
    return {
      expanded: false,
      children: null,
      nodeBalance: this.balance
    };
  },
  computed: {
    iconName() {
      if (this.children && this.children.length == 0) return 'chevron-right';
      return this.expanded ? 'chevron-down' : 'chevron-right';
    },
    computedBalance() {
      return this.nodeBalance;
    },
    creditOrDebit() {
      if (['Asset', 'Expense'].includes(this.rootType))
        return this.nodeBalance > 0 ? 'Dr' : 'Cr';

      return this.nodeBalance > 0 ? 'Cr' : 'Dr';
    }
  },
  components: {
    Branch: () => Promise.resolve(Branch)
  },
  async mounted() {
    this.settings = frappe.getMeta(this.doctype).treeSettings;
    if (this.nodeBalance != 0) {
      this.$emit('updateBalance', this.nodeBalance);
    }
    await this.toggleChildren();
    this.expanded = !this.expanded;
    if (this.label === (await this.settings.getRootLabel())) {
      await this.toggleChildren();
    }
  },
  methods: {
    async toggleChildren() {
      await this.getChildren();
      this.expanded = !this.expanded;
    },
    async updateBalance(balance) {
      this.nodeBalance += balance;
      this.$emit('updateBalance', this.nodeBalance);
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
        fields: [
          this.settings.parentField,
          'isGroup',
          'name',
          'balance',
          'rootType'
        ],
        orderBy: 'name',
        order: 'asc'
      });

      this.children = children.map(c => {
        c.label = c.name;
        c.balance = c.balance;
        c.rootType = c.rootType;
        return c;
      });
    }
  }
};

export default Branch;
</script>
<style lang="scss">
@import '../../styles/variables';

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
