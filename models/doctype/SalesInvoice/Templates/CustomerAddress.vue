<template>
    <div v-if="this.detailsPresent">
        <p :style="[$.bold, $.mediumFontSize]">Billed To</p>
        <p :style="[$.bold, $.paraStyle]">{{ customer }}</p>
        <p :style="$.paraStyle">{{ customerAddress.addressLine1 }}</p>
        <p :style="$.paraStyle">{{ customerAddress.addressLine2 }}</p>
        <p :style="$.paraStyle">
            {{ customerAddress.city + ' ' + customerAddress.state }}
        </p>
        <p :style="$.paraStyle">
            {{ customerAddress.country + ' - ' + customerAddress.postalCode }}
        </p>
    </div>
</template>
<script>
import addressDetails from './AddressDetails';
import styles from './InvoiceStyles';
export default {
    name: 'CustomerAddress',
    props: ['customer'],
    data() {
        return {
            $: styles,
            detailsPresent: true,
            customerAddress: {}
        }
    },
    async created() {
        this.$ = styles;
        try {
            this.customerAddress = await addressDetails.getCustomerAddress(this.customer);
        } catch(e) {
            this.detailsPresent = false;
        }
    }
}
</script>