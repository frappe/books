<template>
    <div>
        <p :style="[$.bold]" style="font-size: 1.3em">{{ companyDetails.name }}</p>
        <p :style="$.paraStyle">{{ companyDetails.address.addressLine1 }}</p>
        <p :style="$.paraStyle">{{ companyDetails.address.addressLine2 }}</p>
        <p :style="$.paraStyle">
            {{ companyDetails.address.city + ' ' + companyDetails.address.state }}
        </p>  
        <p :style="$.paraStyle">
            {{ companyDetails.address.country + ' - ' + companyDetails.address.postalCode }}
        </p>
    </div>
</template>
<script>
import addressDetails from './AddressDetails';
import styles from './InvoiceStyles';
export default {
    name: 'CompanyAddress',
    data() {
        return {
            $: styles,
            companyDetails: {
                name: null,
                address: {}
            }
        }
    },
    async created() {
        this.$ = styles;
        this.companyDetails = await addressDetails.getCompanyDetails();
    }
}
</script>