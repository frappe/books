<template>
<div class="row">
  <div class="col-md-6">
    <h6>Cash</h6>
    <input class="form-control" v-model="cash" @click="() => changeFocus(this.inputFields.cash)">
    <h6>Cheque</h6>
    <input class="form-control" v-model="cheque" @click="() => changeFocus(this.inputFields.cheque)">
    <h6>Outstanding</h6>
    <input class="form-control" v-model="outstandingAmount">
    <div class="col-md-6">
        <div class="list-group">
            <button type="button" class="btn btn-primary" @click="submit()">
                  <strong>Submit</strong>
            </button>
        </div>
    </div>
  </div>
  <div class="col-md-6">
    <numpad :appendNum="append" :addDecimalPoint="addDP" :delNum="del"></numpad>
  </div>
</div>
</template>

<script>
import Numpad from "./Numpad";
export default {
    components: {
      Numpad
    },
    props: ["netTotal", "grandTotal", "createInvoice"],
    data() {
      return {
        netTotal: 0,
        value:"",
        cash: 0,
				cheque: 0,
				focused: "",
        cashDecCount: 0,
        chequeDecCount: 0,
				inputFields: {
          cash: "CASH",
					cheque: "CHEQUE",
          cashDec: "CASH_DEC",
          chequeDec: "CHEQUE_DEC"
				}
      }
    },
    methods: {
      append: function(value){
				switch(this.focused){
					case "CASH": this.cash = this.cash*10 + value; break;
          case "CASH_DEC": 
            if(this.cashDecCount == -2) break;
            this.cashDecCount--;
            this.cash = this.cash + Math.pow(10, this.cashDecCount)*value;
            if(this.cashDecCount == -2) this.cash = this.cash.toFixed(2);
            break;
					case "CHEQUE": this.cheque = this.cheque*10 + value; break;
          case "CHEQUE_DEC": 
            if(this.chequeDecCount == -2) break;
            this.chequeDecCount--;
            this.cheque = this.cheque + Math.pow(10, this.chequeDecCount)*value;
            if(this.chequeDecCount == -2) this.cheque = this.cheque.toFixed(2);
            break;
				}	
			},
			del: function() {
				switch(this.focused){
					case "CASH": this.cash = (this.cash - this.cash%10)/10; break;
          case "CASH_DEC": 
            this.cash = parseFloat(this.cash.toString().slice(0,-1));
            this.cashDecCount++;
            if(this.cashDecCount == 0) this.focused = "CASH"; break;
            break;
					case "CHEQUE": this.cheque = (this.cheque - this.cheque%10)/10; break;
          case "CHEQUE_DEC": 
            this.cheque = parseFloat(this.cheque.toString().slice(0,-1));
            this.chequeDecCount++;
            if(this.chequeDecCount == 0) this.focused = "CHEQUE"; break;
            break;
				}
    	},
    	addDP: function(value) {
				switch(this.focused){
					case "CASH": this.focused = "CASH_DEC"; break;
					case "CHEQUE": this.focused = "CHEQUE_DEC"; break;
				}
   	 	},
			changeFocus: function(target){
        this.focused = target;
        switch(target){
          case "CASH": if(this.cashDecCount < 0) this.focused = "CASH_DEC"; break;
          case "CHEQUE": if(this.chequeDecCount < 0) this.focused = "CHEQUE_DEC"; break;
        }
			},
      submit(){
        this.createInvoice(this);
    },
    },
    computed: {
        outstandingAmount(){
          console.log(this.focused);
            return (this.grandTotal - parseFloat(this.cash) - parseFloat(this.cheque)).toFixed(2);
        }
    }
}
</script>

<style scoped>
.form-control {
    margin-bottom: 16px;
}
</style>