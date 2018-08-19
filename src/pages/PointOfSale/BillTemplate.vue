<template>
	<div class="bill">
    <h4>ABC Store</h4>
    <hr>

  <table class="table table-borderless" style="margin-top:4rem">
    <tbody>
      <tr>
        <td>Customer: {{customer}}</td>
        <td class="numerical-value">{{today}}</td>
      </tr>
    </tbody>
  </table>

  <hr>

  <table class="table table-borderless">
    <thead>
      <tr>
        <th>Sr No.</th>
        <th>Item</th>
        <th class="numerical-value">Qty</th>
        <th class="numerical-value">Rate</th>
        <th class="numerical-value">AMT</th>
      </tr>
    </thead>
    <!-- </table>
    <hr>
    <table class="table table-borderless"> -->
    <tbody v-for="(item, index) in items">
      <tr>
        <td>{{index + 1}}</td>
        <td>{{item.item.name}}</td>
        <td class="numerical-value">{{item.numberOfItems}}</td>
        <td class="numerical-value">{{item.item.rate}}</td>
        <td class="numerical-value">{{item.numberOfItems * item.item.rate}}</td>
      </tr>
    </tbody>
  </table>
  <hr>

  <table class="table table-borderless">
    <tbody>
      <tr>
        <td>Net Total: </td>
        <td class="numerical-value">{{netTotal}}</td>
      </tr>
      <tr>
        <td>Tax: </td>
        <td class="numerical-value">{{grandTotal - netTotal}}</td>
      </tr>
      <tr>
        <td>Grand Total: </td>
        <td class="numerical-value">{{grandTotal}}</td>
      </tr>
    </tbody>
  </table>

  <hr>

  <p style="text-align:center">Thank you for visiting!</p>

  </div>
</template>

<script>
import { DateTime } from 'luxon';

export default {
  name: 'bill-template',
  props: ['items', 'customer', 'netTotal', 'grandTotal'],
  computed: {
    today() {
      // get current date
      let today = DateTime.local();
      let dd = today.day();
      let mm = today.month();
      let yyyy = today.year();
      if (dd < 10) {
        dd = '0' + dd;
      }
      if (mm < 10) {
        mm = '0' + mm;
      }
      today = dd + '/' + mm + '/' + yyyy;
      return today;
    }
  }
};
</script>

<style scoped>
.bill {
  margin: 2rem;
  /* width: 20rem; */
}
th {
  padding: 0.4rem;
}
td {
  padding: 0.4rem;
}
hr {
  border: none;
  height: 0.1rem;
  /* Set the hr color */
  color: #333; /* old IE */
  background-color: #333; /* Modern Browsers */
}
.numerical-value {
  text-align: right;
}
</style>