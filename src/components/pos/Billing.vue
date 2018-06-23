<template>
<div class="col-md-6">
    <div class="list-group">
        <button class="list-group-item item" @click="printPDF()">
            <strong>Generate Bill</strong>
        </button>
    </div>
</div>
</template>

<script>
export default {
  methods: {
	// actual PDF options
	async printPDF(){
        // init the jsPDF library
        let pdf = new jsPDF();
        // @param 1 - Coordinate (in units declared at inception of PDF document) against left edge of the page
        // @param 2 - Coordinate (in units declared at inception of PDF document) against upper edge of the page
        // @param 3 - String or array of strings to be added to the page. Each line is shifted one line down per font, spacing settings declared before this call.
        pdf.text(10, 10, `You have to pay ${tempdoc.grandTotal}$`);
        // save the PDF document (downloadable)
        pdf.save();
    },
  }
}
</script>