<template>
    <div class="list-group">
        <button class="list-group-item item" v-for="item in items" :key="item.name" @click="itemClicked(item)">
            <strong>{{ item.name }}</strong> - {{ item.price }}
        </button>
    </div>
</template>
<script>
export default {
  name: 'ItemList',
  props: ["items", "add"],
  methods: {
    itemClicked(item) {
      this.add(item);
    }
  }
};
</script>