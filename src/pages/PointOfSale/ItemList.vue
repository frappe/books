<template>
  <div class="row">
    <button class="list-group-item item-grid col-sm-4" v-for="item in items" :key="item.name" @click="itemClicked(item)"> 
      <strong>{{ item.name }}</strong><br>
        <img v-bind:src=item.image><br>
      <strong>INR</strong> - {{ item.rate }}
    </button>
  </div>
</template>

<style lang="scss">
img {
  height: 100px;
  width: 100px;
}
.item-grid {
  margin: 15px;
  height: 200px;
}
</style>

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