<template>
	<div class="numpad">
    <input type="text" v-model="amount"><br/>
    <div class="btn-group-vertical ml-4 mt-4" role="group" aria-label="Basic example">
      <div class="btn-group">
        <button @click="append(1)" class="btn btn-outline-secondary border-bottom-0 rounded-0">1</button>
        <button @click="append(2)" class="btn btn-outline-secondary border-bottom-0">2</button>
        <button @click="append(3)" class="btn btn-outline-secondary border-bottom-0 rounded-0">3</button>
      </div>
      <div class="btn-group">
        <button @click="append(4)" class="btn btn-outline-secondary border-bottom-0 rounded-0">4</button>
        <button @click="append(5)" class="btn btn-outline-secondary border-bottom-0">5</button>
        <button @click="append(6)" class="btn btn-outline-secondary border-bottom-0 rounded-0">6</button>
      </div>
      <div class="btn-group">
        <button @click="append(7)" class="btn btn-outline-secondary border-bottom-0 rounded-0">7</button>
        <button @click="append(8)" class="btn btn-outline-secondary border-bottom-0">8</button>
        <button @click="append(9)" class="btn btn-outline-secondary border-bottom-0 rounded-0">9</button>
      </div>
      <div class="btn-group">
        <button @click="del()" class="btn btn-outline-secondary rounded-0">Del</button>
        <button @click="append(0)" class="btn btn-outline-secondary">0</button>
        <button @click="addDecimalPoint()" class="btn btn-outline-secondary rounded-0">.</button>
	    </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "numpad",
  data() {
    return {
      amount: ""
    };
  },
  methods: {
    append: function(value) {
      this.amount += value;
    },
    del: function() {
      this.amount = this.amount.slice(0, -1);
    },
    addDecimalPoint: function(value) {
      if (!this.amount.includes(".")) this.amount += ".";
    }
  }
};
</script>
<style scoped>
.btn {
    font-size: 20px;
    width:64px;
    height:64px;
}
</style>