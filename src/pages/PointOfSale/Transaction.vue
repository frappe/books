<template>
    <div class="scroll-y-wrapper">
        <table class="table table-striped table-hover table-bordered " v-if="items.length">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Number of Items</th>
                    <th>Amount</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="item in items" :key="item.name">
                    <td>{{ item.item.name }}</td>
                    <td>
                        <span v-if="!item.editing" @click="toggleEdit(item)">{{ item.numberOfItems }}</span>
                        <input v-if="item.editing" @blur="toggleEdit(item)" type="number" min=1 v-model="item.numberOfItems">
                    </td>
                    <td style="text-align:right">{{ item.numberOfItems * item.item.rate }}</td>
                    <td><a class="fa fa-times" @click="removeItem(item)">X</a></td>
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
</style>