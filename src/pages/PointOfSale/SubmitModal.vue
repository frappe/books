<template>
<div class="col-md-12">
    <div class="list-group p-5">
        <billing :items="lineItems" :customer="customer" :netTotal="netTotal" :grandTotal="grandTotal"></billing>
        <br>
        <button class="btn btn-light border" @click="clearform()">
            <strong>Clear Form</strong>
        </button>
    </div>
</div>
</template>

<script>
import Billing from "./Billing";
export default {
    components: {
        Billing
    },
    props: ["lineItems", "customer", "netTotal", "grandTotal", "clearForm"],
    methods: {
        clearform(){
        this.clearForm();
        }
    }
}
</script>
