<template>
<div class="row">
  <div class="col-md-6">
    <h6>Cheque</h6>
    <input v-model="cheque">
    <h6>Outstanding</h6>
    <input v-model="outstanding">
    <h6>Cash</h6>
    <input v-model="cash">
  </div>
  <div class="col-md-6">
    <numpad></numpad>
  </div>
</div>
</template>

<script>
import Numpad from "../Numpad";
export default {
    components: {
      Numpad
    },
    data: {
        cash: 0,
        cheque: 0,
        outstanding: 0
    },
    computed: {
        outstandingAmount(){
            outstanding =  grandTotal - cash - cheque
        }
    }
}
</script>
