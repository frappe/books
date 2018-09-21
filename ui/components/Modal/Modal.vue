<template>
  <div :class="['modal fade show d-block']" @click.self="onBackdropClick"
    tabindex="-1" role="dialog" aria-labelledby="frappe-modal-label" aria-hidden="true">
    <div class="modal-dialog" role="document">
      <div class="modal-content shadow">
        <div class="modal-header" v-if="!noHeader">
          <h5 class="modal-title">{{ title }}</h5>
          <button type="button" class="close" data-dismiss="modal" aria-label="Close" @click="closeModal">
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <div class="modal-body modal-height p-0">
          <component ref="modalComponent" :is="component" v-bind="props" v-on="events"/>
        </div>
        <div class="modal-footer" v-if="!noFooter">
          <!-- <f-button secondary @click="closeModal">{{ _('Close') }}</f-button> -->
          <f-button primary v-if="primaryAction" @click="onPrimaryAction">{{ primaryAction.label }}</f-button>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  props: {
    title: {
      type: String,
      default: "Modal Title"
    },
    primaryAction: {
      type: Object,
      default: null
    },
    component: {
      type: Object
    },
    props: {
      type: Object
    },
    events: {
      type: Object
    },
    noHeader: {
      type: Boolean,
      default: false
    },
    noFooter: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    closeModal() {
      this.$emit('close-modal');
    },
    onPrimaryAction() {
      this.primaryAction.handler(this.$refs.modalComponent);
    },
    onBackdropClick(e) {
      this.closeModal();
    }
  }
};
</script>
<style scoped>
.modal-height {
  max-height: 80vh;
  overflow: auto;
}
</style>
