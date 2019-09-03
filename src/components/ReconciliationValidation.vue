<template>
  <div id="importWizard" class="modal-body" style="overflow: hidden;">
    <div class="row">
      <div class="col-12">
        <!-- <div v-for="(entry, i) in entries" :key="i">{{ entry['Date'] }}</div> -->
        <table class="table table-sm">
          <thead style="font-size: 13px">
            <tr>
              <th scope="col">
                <input type="checkbox" checked="true" ref="all" @change="allSelected" />
              </th>
              <th
                scope="col"
                v-for="(fieldname, index) in Object.keys(entries[0])"
                :key="index"
              >{{ fieldname }}</th>
            </tr>
          </thead>
          <tbody style="font-size: 13px">
            <tr v-for="(entry, index) in entries" :key="index">
              <th scope="row">
                <input type="checkbox" checked="true" :ref="'cb-'+index" @change="rowSelected" />
              </th>
              <td v-for="(fieldname, idx) in Object.keys(entry)" :key="idx">{{ entry[fieldname] }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div class="row">
      <div class="col-12 text-right">
        <f-button primary @click="reconcile">{{ 'Reconcile' }}</f-button>
      </div>
    </div>
  </div>
</template>
<script>
const luxon = require('luxon');

export default {
  props: ['entries', 'afterReconcile'],
  data() {
    return {
      selectedEntries: []
    };
  },
  methods: {
    allSelected() {
      for (let i = 0; i < this.entries.length; i++) {
        this.$refs['cb-' + i][0].checked = this.$refs['all'].checked;
      }
    },
    rowSelected() {
      for (let i = 0; i < this.entries.length; i++) {
        if (!this.$refs['cb-' + i][0].checked) {
          this.$refs['all'].checked = false;
        }
      }
    },
    close() {
      this.$modal.hide();
    },
    async reconcile() {
      for (let i = 0; i < this.entries.length; i++) {
        if (this.$refs['cb-' + i][0].checked)
          this.selectedEntries.push(this.entries[i]);
      }
      for (let entry of this.selectedEntries) {
        const payment = await frappe.getDoc('Payment', entry['Payment Entry']);
        const clearanceDate =
          luxon.DateTime.fromFormat(
            entry['Clearance Date'],
            'dd/MM/yy'
          ).toISO() ||
          luxon.DateTime.fromFormat(
            entry['Clearance Date'],
            'dd/MM/yyyy'
          ).toISO();
        payment.set({ clearanceDate });
        await payment.update();
      }
      this.close();
      await this.afterReconcile();
    }
  }
};
</script>
<style>
.modal-dialog {
  max-width: 600px !important;
}
</style>
