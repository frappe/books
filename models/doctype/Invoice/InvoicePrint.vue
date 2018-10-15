<template>
  <div class="print-view p-5">
    <h1>{{ doc.name }}</h1>
    <div class="row py-4">
        <div class="col-6">
            <div><b>{{ _("Customer") }}</b></div>
            <div>{{ doc.customer }}</div>
        </div>
        <div class="col-6">
            <div><b>{{ _("Date") }}</b></div>
            <div>{{ frappe.format(doc.date, 'Date') }}</div>
        </div>
    </div>
    <table class="table table-bordered">
        <thead>
            <tr>
                <th style='width: 30px'></th>
                <th>{{ _("Item") }}</th>
                <th class='text-right'>{{ _("Qty") }}</th>
                <th class='text-right'>{{ _("Rate") }}</th>
                <th class='text-right'>{{ _("Amount") }}</th>
            </tr>
        </thead>
        <tbody>
            <tr v-for="row in doc.items" :key="row.idx">
                <td class='text-right'>{{ row.idx + 1 }}</td>
                <td>{{ row.item }}<br>{{ frappe.format(row.description, 'Text') }}</td>
                <td class='text-right'>{{ row.quantity }}</td>
                <td class='text-right'>{{ frappe.format(row.rate, 'Currency') }}</td>
                <td class='text-right'>{{ frappe.format(row.amount, 'Currency') }}</td>
            </tr>
        </tbody>
    </table>
    <div class='row'>
        <div class='col-6'></div>
        <div class='col-6'>
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
            <div class='row py-3'>
                <div class='col-6'>
                    <h5>{{ _("Grand Total") }}</h5>
                </div>
                <div class='col-6 text-right'>
                    <h5>{{ frappe.format(doc.grandTotal, 'Currency')}}</h5>
                </div>
            </div>
        </div>
    </div>
    <div class='py-3'>
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
