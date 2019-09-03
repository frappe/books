<template>
  <div id="importWizard" class="modal-body" style="overflow: hidden;">
    <div class="mx-auto col-12 text-center pb-3">
      <input ref="fileInput" @change="importCSV" id="file-input" type="file" />
      <div class="form-check-label bold">{{ "Drag & Drop a CSV file" }}</div>
    </div>
    <div class="row footer-divider mb-3">
      <div class="col-12" style="border-bottom:1px solid #e9ecef"></div>
    </div>
    <div class="row">
      <div class="col-12 text-right">
        <f-button primary @click="importCSV">{{ 'Import' }}</f-button>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  props: ['importHandler', 'report'],
  methods: {
    close() {
      this.$modal.hide();
    },
    async importCSV(evt) {
      if (evt.target.files) {
        const file = evt.target.files[0];
        this.importHandler(file, this.report);
        this.$modal.hide();
      }
      this.$refs.fileInput.click();
    }
  }
};
</script>
<style scoped>
.fixed-btn-width {
  width: 5vw !important;
}
.bold {
  font-size: 1.1rem;
  font-weight: 600;
}
#file-input {
  position: absolute;
  left: 0;
  opacity: 0;
  width: 100%;
  height: 100%;
}
</style>
