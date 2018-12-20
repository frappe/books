<template>
    <div style="font-family: 'Montserrat', sans-serif;">
        <div class="row pl-5 pr-5 mt-5">
            <div :style="regularFontSize" class="col-6">
                <p :style="[bold]" style="font-size: 1.3em">Frappe Technologies</p>
                <p :style="paraStyle">D/324 Neelkanth Business Park,</p>
                <p :style="paraStyle">Vidyavihar West,</p>
                <p :style="paraStyle">Mumbai - 400086</p>            
            </div>
            <div :style="regularFontSize" class="col-6 text-right">
                <h2 :style="headerFontColor">INVOICE</h2>
                <p :style="paraStyle"><strong>{{ doc.name }}</strong></p>
                <p :style="paraStyle">{{ frappe.format(doc.date, 'Date') }}</p>
            </div>
        </div>
        <div class="row pl-5 mt-5">
            <div :style="regularFontSize" class="col-6 mt-1">
                <p :style="[bold, mediumFontSize]">Billed To</p>
                <p :style="paraStyle">{{ doc.customer }}</p>
                <p :style="paraStyle">D/324 Neelkanth Business Park,</p>
                <p :style="paraStyle">Vidyavihar West,</p>
                <p :style="paraStyle">Mumbai - 400086</p>
            </div>
        </div>
        <div :style="regularFontSize" class="row pl-5 pr-5 mt-5">
            <div class="col-12">
                <table class="table p-0">
                    <thead>
                        <tr :style="showBorderBottom">
                            <th :style="hideBorderTop" class="text-left pl-0" style="width: 10%">{{ _("NO") }}</th>
                            <th :style="hideBorderTop" class="text-left" style="width: 60%">{{ _("ITEM") }}</th>
                            <th :style="hideBorderTop" class="text-left pl-0" style="width: 20%">{{ _("RATE") }}</th>
                            <th :style="hideBorderTop" class="text-left" style="width: 15%">{{ _("QTY") }}</th>
                            <th :style="hideBorderTop" class="text-right pr-1" style="width: 20%">{{ _("AMOUNT") }}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="row in doc.items" :key="row.idx">
                            <td class="text-left pl-1">{{ row.idx + 1 }}</td>
                            <td class="text-left">{{ row.item }}</td>
                            <td class="text-left pl-0">{{ frappe.format(row.rate, 'Currency') }}</td>
                            <td class="text-left">{{ row.quantity }}</td>
                            <td class="text-right pr-1">{{ frappe.format(row.amount, 'Currency') }}</td>
                        </tr>
                        <tr>
                            <td colspan="2" class="text-left pl-1"></td>
                            <td colspan="2" :style="bold" class="text-left pl-0">SUBTOTAL</td>
                            <td :style="bold" class="text-right pr-1">{{ frappe.format(doc.netTotal, 'Currency') }}</td>
                        </tr>
                        <tr v-for="tax in doc.taxes" :key="tax.name">
                            <td colspan="2" :style="hideBorderTop" class="text-left pl-1"></td>
                            <td colspan="2" :style="bold" class="text-left pl-0">{{ tax.account.toUpperCase() }} ({{ tax.rate }}%)</td>
                            <td :style="bold" class="text-right pr-1">{{ frappe.format(tax.amount, 'Currency') }}</td>
                        </tr>
                        <tr>
                            <td colspan="2" :style="hideBorderTop" class="text-left pl-1"></td>
                            <td colspan="2" :style="[bold, mediumFontSize, showBorderTop]" class="text-left pl-0">TOTAL</td>
                            <td :style="[bold, mediumFontSize, showBorderTop]" class="text-right pr-1" style="color: green;">{{ frappe.format(doc.grandTotal, 'Currency') }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
        <div class="row pl-5 pr-5 mt-5">
            <div :style="regularFontSize" class="col-12">
                <table class="table">
                    <tbody>
                        <tr :style="[bold, showBorderBottom]" ><td :style="hideBorderTop" class="pl-0">NOTICE</td></tr>
                        <tr><td class="pl-0">{{ doc.terms }}</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>
<script>
export default {
    name: 'InvoicePrint1',
    props: ['doc','themeColor'],
    data() {
        return {
            bold: {
                fontWeight: 'bold'
            },
            regularFontSize: {
                fontSize: '0.8em'
            },
            mediumFontSize: {
                fontSize: '1.2em'
            },
            paraStyle: {
                margin: '10px',
                marginLeft: 0
            },
            hideBorderTop: {
                borderTop: '0px solid black'
            },
            headerFontColor: {
                color: null
            },
            showBorderBottom: {
                borderBottom: null
            },
            showBorderTop: {
                borderTop: null
            }
        }
    },
    watch: {
        themeColor: function() {
            this.setTheme();
        }
    },
    async created() {
        this.setTheme();
    },
    methods: {
        setTheme() {
            this.headerFontColor.color = this.themeColor;
            this.showBorderBottom.borderBottom = `0.3em solid ${this.themeColor}`;
            this.showBorderTop.borderTop = `0.2em solid ${this.themeColor}`;
        }
    }
}
</script>
<style scoped>
    @import url('https://fonts.googleapis.com/css?family=Montserrat');
</style>
