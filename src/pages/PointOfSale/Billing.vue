<template>
<div class="col-md-12">
    <div class="list-group">
        <button class="list-group-item item" @click="printPDF()">
            <strong>Print Bill</strong>
        </button>
    </div>
</div>
</template>

<script>
import  jsPDF from 'jspdf';
export default {
  props: ["items", "customer", "netTotal", "grandTotal"],
  methods: {
    printPDF() {
      // console.log(this.items, this.customer, this.netTotal, this.grandTotal);

      // get current date
      let today = new Date();
      let dd = today.getDate();
      let mm = today.getMonth() + 1; //January is 0!
      let yyyy = today.getFullYear();
      if (dd < 10) {
        dd = "0" + dd;
      }
      if (mm < 10) {
        mm = "0" + mm;
      }
      today = mm + "/" + dd + "/" + yyyy;

      // create new pdf object
      let pdf = new jsPDF("p", "mm", [58, 100]);
      //Initialize x, y coordinates
      let x = 5;
      let y = 5;
      // Set columnwidth for table
      const columnWidth = 10.5;
      const lineLength = 48;
      const rightAlign = 2;

      // Header
      pdf.setFontSize(8);
      // pdf.setFont("monospaced sans serif");
      pdf.setFontType("bold");
      pdf.text(x, y, "ABC Store");
      y += 2;
      pdf.line(x, y, x + lineLength, y);
      y += 5;

      // Body
      pdf.setFontSize(6);
      pdf.setTextColor(0, 0, 0);
      pdf.setFontType("normal");

      y += 8;
      pdf.text(x, y, "Customer: " + this.customer);
      pdf.text(x + 3 * columnWidth + 3, y, today);
      y += 3;

      y += 20;
      pdf.text(x, y, "Items:");
      y += 10;
      this.items.forEach(item => {
        pdf.text(x, y, item.item.name + " : " + item.numberOfItems);
        y += 10;
      });

      y += 5;
      pdf.line(x, y, x + 165, y);

      y += 10;
      pdf.text(x, y, "Net Total: " + this.netTotal);
      y += 10;
      pdf.text(x, y, "Grand Total: " + this.grandTotal);

      pdf.autoPrint();
      // pdf.save(); //to download pdf
      window.open(pdf.output("bloburl"), "_blank");
    }
  }
};
</script>