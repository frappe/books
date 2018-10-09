<template>
    <div class="scroll-y-wrapper">
        <table class="table table-striped table-hover " v-if="items.length">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Quantity</th>
                    <th class="text-right">Amount</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="item in items" :key="item.name">
                    <td>{{ item.item.name }}</td>
                    <td class="p-0 fix-width">
                        <div v-if="!item.editing" @click="toggleEdit(item)" class="pl-3 pt-2">{{ item.numberOfItems }}</div>
                        <input autofocus v-if="item.editing" @blur="toggleEdit(item)" class="form-control mt-1" type="number" min=1 v-model="item.numberOfItems">
                    </td>
                    <td class="text-right">{{ item.numberOfItems * item.item.rate }}</td>
                    <td>
                        <a @click="removeItem(item)">
                            <feather-icon name="x"/>
                        </a>
                    </td>
                </tr>
            </tbody>
        </table>
        <p v-if="!items.length">No items have been added.</p>
    </div>
</template>

<script>
export default {
  props: ['items', 'edit', 'remove'],
  methods: {
    toggleEdit: function(item) {
      this.edit(item);
    },
    removeItem: function(item) {
      this.remove(item);
    }
  }
};
</script>

<style scoped>
.scroll-y-wrapper {
  max-height: 250px;
  overflow-y: scroll;
}
.table {
    margin-bottom: 0px;
}
.fix-width {
    width: 48px;
}
</style>