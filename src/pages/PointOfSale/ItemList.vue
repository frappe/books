<template>
  <div class="row scroll-y-wrapper">
    <button class="list-group-item item-grid" v-for="item in items" :key="item.name" @click="itemClicked(item)"> 
      <strong>{{ item.name }}</strong><br>
        <img v-bind:src=item.image><br>
      <strong>INR</strong> - {{ item.rate }}
    </button>
  </div>
</template>

<script>
export default {
  props: ['items', 'add'],
  methods: {
    itemClicked(item) {
      this.add(item);
    }
  }
};
</script>

<style lang="scss">
img {
  height: 100px;
  width: 100px;
}
.item-grid {
  padding: 8px 32px;
  height: 200px;
}
.scroll-y-wrapper {
  max-height: 350px;
  overflow-y: scroll;
}
</style>