<template>
<div class="col-md-12">
    <div class="list-group">
        <billing :items="lineItems" :lineItems="lineItems" :customer="customer" :netTotal="netTotal" :grandTotal="grandTotal"></billing>
    </div>
</div>
</template>

<script>
import Billing from "./Billing";
export default {
    components: {
        Billing
    }
}
</script>
