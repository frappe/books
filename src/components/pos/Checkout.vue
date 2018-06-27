<template>
<div class="row">
  <div class="col-md-6">
    <h6>Cash</h6>
    <input v-model="cash" @click="() => changeFocus(this.inputFields.cash)">
    <h6>Cheque</h6>
    <input v-model="cheque" @click="() => changeFocus(this.inputFields.cheque)">
    <h6>Outstanding</h6>
    <input v-model="outstandingAmount">
  </div>
  <div class="col-md-6">
    <numpad :appendNum="append" :addDecimalPoint="addDP" :delNum="del"></numpad>
  </div>
</div>
</template>

<script>
import Numpad from "../Numpad";
export default {
    components: {
      Numpad
    },
    props: ['grandTotal'],
    data() {
      return {
        cash: 0,
				cheque: 0,
				focused: "",
				inputFields: {
          cash: "CASH",
					cheque: "CHEQUE"
				}
      }
    },
    methods: {
      append: function(value){
				switch(this.focused){
					case "CASH": this.cash += value; break;
					case "CHEQUE": this.cheque += value; break;
				}	
			},
			del: function() {
				switch(this.focused){
					case "CASH": this.cash = this.cash.slice(0, -1); break;
					case "CHEQUE": this.cheque = this.cheque.slice(0, -1);; break;
				}
    	},
    	addDP: function(value) {
				switch(this.focused){
					case "CASH": if (!this.cash.includes(".")) this.cash += "."; break;
					case "CHEQUE": if (!this.cheque.includes(".")) this.cheque += "."; break;
				}
   	 	},
			changeFocus: function(target){
        this.focused = target;
        console.log(this.grandTotal);
			}
    },
    computed: {
        outstandingAmount(){
            return this.grandTotal - parseFloat(this.cash) - parseFloat(this.cheque)
        }
    }
}
</script>
