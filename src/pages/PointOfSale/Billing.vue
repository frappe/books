<template>
  <button class="list-group-item item" @click="printPDF()">
    <strong>Print Bill</strong>
  </button>
</template>

<script>
import jsPDF from 'jspdf';
export default {
  props: ['items', 'customer', 'netTotal', 'grandTotal'],
  methods: {
    printPDF() {
      // console.log(this.items, this.customer, this.netTotal, this.grandTotal);

      // get current date
      let today = new Date();
      let dd = today.getDate();
      let mm = today.getMonth() + 1; //January is 0!
      let yyyy = today.getFullYear();
      if (dd < 10) {
        dd = '0' + dd;
      }
      if (mm < 10) {
        mm = '0' + mm;
      }
      today = mm + '/' + dd + '/' + yyyy;

      // create new pdf object
      let pdf = new jsPDF('p', 'mm', [58, 100]);
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
      pdf.setFontType('bold');
      pdf.text(x, y, 'ABC Store');
      y += 2;
      pdf.line(x, y, x + lineLength, y);
      y += 5;

      // Body
      pdf.setFontSize(6);
      pdf.setTextColor(0, 0, 0);
      pdf.setFontType('normal');

      y += 8;
      pdf.text(x, y, 'Customer: ' + this.customer);
      pdf.text(x + 3 * columnWidth + 3, y, today);
      y += 3;

      // table headers
      let headerX = x;
      pdf.line(x, y, x + lineLength, y);
      y += 3;
      pdf.text(headerX, y, 'Sr No.');
      headerX += columnWidth;
      pdf.text(headerX, y, 'Item');
      headerX += columnWidth;
      pdf.text(headerX, y, 'QTY');
      headerX += columnWidth;
      pdf.text(headerX, y, 'Rate');
      headerX += columnWidth;
      pdf.text(headerX, y, 'AMT');
      y += 2;
      pdf.line(x, y, x + lineLength, y);
      y += 5;

      // items table
      let srNo = 1;
      this.items.forEach(item => {
        let tableX = x;
        tableX += rightAlign;
        pdf.text(tableX, y, srNo + '.');
        srNo++;
        tableX -= rightAlign;
        tableX += columnWidth;
        pdf.text(tableX, y, item.item.name);
        tableX += columnWidth;
        tableX += rightAlign;
        pdf.text(tableX, y, item.numberOfItems + '');
        tableX -= rightAlign;
        tableX += columnWidth;
        pdf.text(tableX, y, item.item.rate + '');
        tableX += columnWidth;
        pdf.text(tableX, y, item.item.rate * item.numberOfItems + '');
        y += 5;
      });

      pdf.line(x, y, x + lineLength, y);

      y += 5;
      pdf.text(x, y, 'Net Total: ');
      pdf.text(x + 4 * columnWidth, y, this.netTotal + '');
      y += 5;
      pdf.text(x, y, 'Tax: ');
      pdf.text(x + 4 * columnWidth, y, this.grandTotal - this.netTotal + '');
      y += 5;
      pdf.text(x, y, 'Grand Total: ');
      pdf.text(x + 4 * columnWidth, y, this.grandTotal + '');
      y += 3;
      pdf.line(x, y, x + lineLength, y);
      y += 3;
      pdf.text(x + columnWidth, y, 'Thank you for visiting!');

      pdf.autoPrint();
      // pdf.save(); //to download pdf
      window.open(pdf.output('bloburl'), '_blank');
    }
  }
};
</script>