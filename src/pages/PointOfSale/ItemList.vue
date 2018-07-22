<template>
    <div class="row">
        <button class="list-group-item col-sm-4" v-for="item in items" :key="item.name" @click="itemClicked(item)"> 
            <strong>{{ item.name }}</strong><br>
            <img src="./images/mobile.jpeg"><br>
            <strong>INR</strong> - {{ item.rate }}
        </button>
    </div>
</template>

<style lang="scss">
img {
    height: 150px;
    width: 100px;
}
</style>

<script>
export default {
  props: ["items", "add"],
  methods: {
      itemClicked(item) {
          this.add(item);
      }
  }
};
</script>