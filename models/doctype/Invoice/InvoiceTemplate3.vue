<template>
    <div :style="regularFontSize" style="font-family: 'Montserrat', sans-serif;">
        <div class="row m-0 pt-5">
            <div class="col-12 text-left pl-5">
                <p :style="[bold, paraStyle, mediumFontSize]">{{ doc.name }}</p>
                <p :style="paraStyle">{{ frappe.format(doc.date, 'Date') }}</p>
            </div>
        </div>
        <div class="row m-0 mt-5">
            <div class="col-6" :style="color"></div>
            <div class="col-4 text-center" style="vertical-align: middle">
                <h1>INVOICE</h1>
            </div>
            <div class="col-2" :style="color"></div>
        </div>
        <div class="row m-0 mt-5" style="font-size: 0.9em;">
            <div class="col-6 text-left pl-5">
                <p :style="[bold, mediumFontSize]">Frappe Technologies</p>
                <p>D/324 Neelkanth Business Park,</p>
                <p>Vidyavihar West,</p>
                <p>Mumbai - 400086</p>
            </div>
            <div class="col-6 text-right pr-5">
                <p :style="[bold, mediumFontSize]">ERPNext Foundation</p>
                <p>D/324 Neelkanth Business Park,</p>
                <p>Vidyavihar West,</p>
                <p>Mumbai - 400086</p>
            </div>
        </div>
        <div class="row mt-5">
            <div class="col-12">
                <table class="table" style="font-size: 0.8em">
                    <tbody>
                        <tr>
                            <td :style="[showBorderRight, tablePadding]" style="width: 15%; padding-left: 5%">{{ _("NO") }}</td>
                            <td :style="[showBorderRight, tablePadding]" style="width: 40%">{{ _("ITEM") }}</td>
                            <td class="text-left" :style="[showBorderRight, tablePadding]" style="width: 20%">{{ _("RATE") }}</td>
                            <td :style="[showBorderRight, tablePadding]" style="width: 10%">{{ _("QTY") }}</td>
                            <td class="text-right" :style="[showBorderRight, tablePadding]" style="width: 20%; padding-right: 5%">{{ _("AMOUNT") }}</td>
                        </tr>
                        <tr v-for="row in doc.items" :key="row.idx">
                            <td :style="tablePadding" style="padding-left: 5%;">{{ row.idx + 1 }}</td>
                            <td :style="tablePadding">{{ row.item }}</td>
                            <td :style="tablePadding" class="text-left">{{ frappe.format(row.rate, 'Currency') }}</td>
                            <td :style="tablePadding">{{ row.quantity }}</td>
                            <td :style="tablePadding" class="text-right" style="padding-right: 5%">{{ frappe.format(row.amount, 'Currency') }}</td>
                        </tr>
                        <tr><td colspan="5" style="padding: 4%"></td></tr>
                        <tr>
                            <td colspan="2" :style="[hideBorderTop, tablePadding]"></td>
                            <td :style="tablePadding" colspan="2">SUBTOTAL</td>
                            <td :style="tablePadding" style="padding-right: 5%" class="text-right">{{ frappe.format(doc.netTotal, 'Currency') }}</td>
                        </tr>
                        <tr v-for="tax in doc.taxes" :key="tax.name">
                            <td colspan="2" :style="[hideBorderTop, tablePadding]"></td>
                            <td :style="tablePadding" colspan="2">{{ tax.account.toUpperCase() }} ({{ tax.rate }}%)</td>
                            <td :style="tablePadding" style="padding-right: 5%" class="text-right">{{ frappe.format(tax.amount, 'Currency') }}</td>
                        </tr>
                        <tr>
                            <td colspan="2" :style="[hideBorderTop, tablePadding]"></td>
                            <td :style="tablePadding" colspan="2" style="background-color: #E1DCE2">TOTAL</td>
                            <td :style="[tablePadding, color]" class="text-right" style="color: white; padding-right: 5%">{{ frappe.format(doc.grandTotal, 'Currency') }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>
<script>
export default {
    name: 'InvoicePrint',
    props: ['doc', 'themeColor'],
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
            color: {
                backgroundColor: null
            },
            hideBorderTop: {
                borderTop: '0px solid black'
            },
            showBorderRight: {
                borderRight: '1px solid #e0e0d1'
            },
            tablePadding: {
                paddingTop: '3%',
                paddingBottom: '3%'
            }
        }
    },
    watch: {
        themeColor: function() {
            this.setTheme();
        }
    },
    created() {
        this.setTheme();
    },
    methods: {
        setTheme() {
            this.color.backgroundColor = this.themeColor;
        }
    }
}
</script>
<style scoped>
    @import url('https://fonts.googleapis.com/css?family=Montserrat');
</style>