<template>
    <div :style="regularFontSize" style="font-family: 'Montserrat', sans-serif;">
        <div class="row no-gutters p-5" :style="headerColor">
            <div class="col-8 text-left">
                <h1>INVOICE</h1>
            </div>
            <div class="col-4 text-right">
                <p :style="[bold]" style="font-size: 1.3em">{{ companyDetails.name }}</p>
                <p :style="paraStyle">{{ companyDetails.address.addressLine1 }}</p>
                <p :style="paraStyle">{{ companyDetails.address.addressLine2 }}</p>
                <p :style="paraStyle">
                    {{ companyDetails.address.city + ' ' + companyDetails.address.state }}
                </p>  
                <p :style="paraStyle">
                    {{ companyDetails.address.country + ' - ' + companyDetails.address.postalCode }}
                </p>
            </div>
        </div>
        <div class="row p-5 mt-4">
            <div class="col-4">
                <p :style="[bold, mediumFontSize]">Billed To</p>
                <p :style="paraStyle">{{ doc.customer }}</p>
                <p :style="paraStyle">{{ customerAddress.addressLine1 }}</p>
                <p :style="paraStyle">{{ customerAddress.addressLine2 }}</p>
                <p :style="paraStyle">
                    {{ customerAddress.city + ' ' + customerAddress.state }}
                </p>
                <p :style="paraStyle">
                    {{ customerAddress.country + ' - ' + customerAddress.postalCode }}
                </p>
            </div>
            <div class="col-4">
                <p :style="[bold, mediumFontSize]">Invoice Number</p>
                <p :style="paraStyle">{{ doc.name }}</p><br>
                <p :style="[bold, mediumFontSize]">Date</p>
                <p :style="paraStyle">{{doc.date}}</p>
            </div>
            <div class="col-4 text-right">
                <p :style="[bold, mediumFontSize]">Invoice Total</p>
                <h2 :style="fontColor">{{ frappe.format(doc.grandTotal, 'Currency') }}</h2>
            </div>
        </div>
        <div class="row pl-5 pr-5 mt-3">
            <div class="col-12">
                <table class="table table-borderless p-0">
                    <thead>
                        <tr :style="[showBorderTop, fontColor]">
                            <th class="text-left pl-0" style="width: 10%">{{ _("NO") }}</th>
                            <th class="text-left" style="width: 60%">{{ _("ITEM") }}</th>
                            <th class="text-left pl-0" style="width: 20%">{{ _("RATE") }}</th>
                            <th class="text-left" style="width: 15%">{{ _("QTY") }}</th>
                            <th class="text-right pr-1" style="width: 20%">{{ _("AMOUNT") }}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr :style="showBorderBottom" v-for="row in doc.items" :key="row.idx">
                            <td class="text-left pl-1">{{ row.idx + 1 }}</td>
                            <td class="text-left">{{ row.item }}</td>
                            <td class="text-left pl-0">{{ frappe.format(row.rate, 'Currency') }}</td>
                            <td class="text-left">{{ row.quantity }}</td>
                            <td class="text-right pr-1">{{ frappe.format(row.amount, 'Currency') }}</td>
                        </tr>
                        <tr><td colspan="5" style="padding: 4%"></td></tr>
                        <tr>
                            <td colspan="2" class="text-left pl-1"></td>
                            <td colspan="2" :style="[bold, fontColor]" class="text-left pl-0">SUBTOTAL</td>
                            <td :style="bold" class="text-right pr-1">{{ frappe.format(doc.netTotal, 'Currency') }}</td>
                        </tr>
                        <tr v-for="tax in doc.taxes" :key="tax.name">
                            <td colspan="2" :style="hideBorderTop" class="text-left pl-1"></td>
                            <td colspan="2" :style="[bold, fontColor]" class="text-left pl-0">{{ tax.account.toUpperCase() }} ({{ tax.rate }}%)</td>
                            <td :style="bold" class="text-right pr-1">{{ frappe.format(tax.amount, 'Currency') }}</td>
                        </tr>
                        <tr>
                            <td colspan="2" :style="hideBorderTop" class="text-left pl-1"></td>
                            <td colspan="2" :style="[bold, fontColor, mediumFontSize]" class="text-left pl-0">TOTAL</td>
                            <td :style="[bold, mediumFontSize]" class="text-right pr-1">{{ frappe.format(doc.grandTotal, 'Currency') }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
        <div class="row pl-5 pr-5 mt-5">
            <div class="col-12">
                <table class="table">
                    <tbody>
                        <tr :style="[bold, showNoticeBottom]" ><td :style="hideBorderTop" class="pl-0">NOTICE</td></tr>
                        <tr><td class="pl-0">{{ doc.terms }}</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>
<script>
import invoiceDetails from './InvoiceDetails';
export default {
    name: 'InvoicePrint',
    props: ['doc', 'themeColor'],
    data() {
        return {
            fontColor: {
                color: null
            },
            headerColor: {
                backgroundColor: null,
                color: 'white'
            },
            bold: {
                fontWeight: 'bold'
            },
            regularFontSize: {
                fontSize: '0.8rem'
            },
            mediumFontSize: {
                fontSize: '1rem'
            },
            paraStyle: {
                margin: '0.8rem',
                marginLeft: 0,
                marginRight: 0
            },
            hideBorderTop: {
                borderTop: '0px solid black'
            },
            showBorderBottom: {
                borderBottom: null
            },
            showNoticeBottom: {
                borderBottom: null
            },
            showBorderTop: {
                borderTop: null
            },
            companyDetails: {
                name: null,
                address: {}
            },
            customerAddress: {}
        }
    },
    watch: {
        themeColor: function() {
            this.setTheme();
        }
    },
    async created() {
        this.companyDetails = await invoiceDetails.getCompanyDetails();
        this.customerAddress = await invoiceDetails.getCustomerAddress(this.doc.customer);
        this.setTheme();
    },
    methods: {
        setTheme() {
            this.fontColor.color = this.themeColor;
            this.headerColor.backgroundColor = this.themeColor;
            this.showBorderBottom.borderBottom = '0.5px solid #e0e0d1';
            this.showNoticeBottom.borderBottom = `0.3em solid ${this.themeColor}`;
            this.showBorderTop.borderTop = `0.2em solid ${this.themeColor}`;    
        }
    }
}
</script>
<style scoped>
    @import url('https://fonts.googleapis.com/css?family=Montserrat');
</style>