<template>
    <div>
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
                        <input v-if="item.editing" @blur="toggleEdit(item)" type="number" v-model="item.numberOfItems">
                    </td>
                    <td style="text-align:right">{{ item.numberOfItems * item.item.rate }}</td>
                    <td><a class="fa fa-times" @click="removeItem(item)">X</a></td>
                </tr>
            </tbody>
        </table>
        <p v-if="!items.length">No items have been added.</p>

        <table class="table">
            <tbody>
                <tr>
                    <td>Subtotal:</td>
                    <td style="text-align:right">{{ subtotal }}</td>
                </tr>
                <tr>
                    <td>Tax:</td>
                    <td style="text-align:right">{{ tax }}</td>
                </tr>
                <tr>
                    <td>Total:</td>
                    <td style="text-align:right">{{ total }}</td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<script>

export default {
    props: ['items', 'edit', 'remove'],
    computed: {
        subtotal: function() {
            var subtotal = 0;

            this.items.forEach(function(item) {
                subtotal += item.item.rate * item.numberOfItems;
            });

            return subtotal;
        },
        tax: function() {
            return this.subtotal * 0.065;
        },
        total: function() {
            return this.subtotal + this.tax;
        }
    },
    methods: {
        toggleEdit: function(item) {
            this.edit(item);
        },
        removeItem: function(item) {
            this.remove(item);
        }
    }
}
</script>
