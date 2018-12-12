<template>
    <div class="print-view">
        <div class="p-5" style="height: 10%; background-color: #006400">
            <h1 style="color: white; display: inline">INVOICE</h1>
            <h5 class="mt-3" style="display: inline; float: right; color: white; font-weight: bold">{{ doc.name }}</h5>
        </div>
        <div class="row pl-5 pr-5 pt-5">
            <div class="col-6">
                <p><b>{{ _("From") }}</b></p>
                <p>Frappe Technologies</p>
                <p>D/324 Neelkanth Business Park,</p>
                <p>Vidyavihar West,</p>
                <p>Mumbai - 400086</p>
            </div>
            <div class="col-6">
                <div style="float: right">
                    <p><b>{{ _("To") }}</b></p>
                    <p>{{ doc.customer }}</p>
                    <p>D/324 Neelkanth Business Park,</p>
                    <p>Vidyavihar West,</p>
                    <p>Mumbai - 400086</p>
                </div>  
            </div>
        </div>
        <div class="row pl-5 pr-5 pt-5">
            <div class="col-6">
                <div><b>{{ _("Date : ") }}</b>
                    {{ frappe.format(doc.date, 'Date') }}
                </div>
            </div>
        </div>
        <div class="pl-5 pr-5 pt-5">
            <table class="table table-borderless p-0">
                <thead>
                    <tr>
                        <th class="pl-0" style="width: 10%">{{ _("No") }}</th>
                        <th style="width: 40%">{{ _("Item") }}</th>
                        <th class="text-right" style="width: 10%">{{ _("Qty") }}</th>
                        <th class="text-right" style="width: 20%">{{ _("Rate") }}</th>
                        <th class="text-right pr-0" style="width: 20%">{{ _("Amount") }}</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="row in doc.items" :key="row.idx">
                        <td class="pl-0">{{ row.idx + 1 }}</td>
                        <td>{{ row.item }}</td>
                        <td class="text-right">{{ row.quantity }}</td>
                        <td class="text-right">{{ frappe.format(row.rate, 'Currency') }}</td>
                        <td class="text-right pr-0">{{ frappe.format(row.amount, 'Currency') }}</td>
                    </tr>
                </tbody>
            </table>
        </div>
        <div class="row pt-5 p-3">
            <div class="col-6"></div>
            <div class="col-6 p-4 pr-5" style="background-color: #006400; color: white;">
                <div class='row'>
                    <div class='col-6'>
                        {{ _("Total") }}
                    </div>
                    <div class='col-6 text-right'>
                        {{ frappe.format(doc.netTotal, 'Currency')}}
                    </div>
                </div>
                <div class='row' v-for="tax in doc.taxes" :key="tax.name">
                    <div class='col-6'>
                        {{ tax.account }} ({{ tax.rate }}%)
                    </div>
                    <div class='col-6 text-right'>
                        {{ frappe.format(tax.amount, 'Currency')}}
                    </div>
                </div>
                <div class='row pt-4'>
                    <div class='col-6'>
                        <h5>{{ _("Grand Total") }}</h5>
                    </div>
                    <div class='col-6 text-right'>
                        <h5>{{ frappe.format(doc.grandTotal, 'Currency')}}</h5>
                    </div>
                </div>
            </div>
        </div>
        <div class='py-3 p-5'>
            <p style="font-weight: bold">Terms and Conditions:</p>
            {{ frappe.format(doc.terms, 'Text') }}
        </div>
    </div>
</template>
<script>
export default {
  name: 'InvoicePrint',
  props: ['doc']
}
</script>
<style scoped>
    p { margin: 10px 0;}
</style>