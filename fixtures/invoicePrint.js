module.exports = {
  doctype: 'PrintFormat',
  name: 'Standard Invoice Format',
  for: 'SalesInvoice',
  template: `
    <h1>{{ doc.name }}</h1>
    <div class="row py-4">
        <div class="col-6">
            <div><b>{{ frappe._("Customer") }}</b></div>
            <div>{{ doc.customer }}</div>
        </div>
        <div class="col-6">
            <div><b>{{ frappe._("Date") }}</b></div>
            <div>{{ frappe.format(doc.date, 'Date') }}</div>
        </div>
    </div>
    <table class="table table-bordered">
        <thead>
            <tr>
                <th style='width: 30px'></th>
                <th>{{ frappe._("Item") }}</th>
                <th class='text-right'>{{ frappe._("Qty") }}</th>
                <th class='text-right'>{{ frappe._("Rate") }}</th>
                <th class='text-right'>{{ frappe._("Amount") }}</th>
            </tr>
        </thead>
        <tbody>
            {% for row in doc.items %}
            <tr>
                <td class='text-right'>{{ row.idx + 1 }}</td>
                <td>{{ row.item }}<br>{{ frappe.format(row.description, 'Text') }}</td>
                <td class='text-right'>{{ row.quantity }}</td>
                <td class='text-right'>{{ frappe.format(row.rate, 'Currency') }}</td>
                <td class='text-right'>{{ frappe.format(row.amount, 'Currency') }}</td>
            </tr>
            {% endfor %}
        </tbody>
    </table>
    <div class='row'>
        <div class='col-6'></div>
        <div class='col-6'>
            <div class='row'>
                <div class='col-6'>
                    {{ frappe._("Total") }}
                </div>
                <div class='col-6 text-right'>
                    {{ frappe.format(doc.netTotal, 'Currency')}}
                </div>
            </div>
            {% for tax in doc.taxes %}
            <div class='row'>
                <div class='col-6'>
                    {{ tax.account }} ({{ tax.rate }}%)
                </div>
                <div class='col-6 text-right'>
                    {{ frappe.format(tax.amount, 'Currency')}}
                </div>
            </div>
            {% endfor %}
            <div class='row py-3'>
                <div class='col-6'>
                    <h5>{{ frappe._("Grand Total") }}</h5>
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
    `
};
