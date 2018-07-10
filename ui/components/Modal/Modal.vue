<template>
  <div :class="['modal fade show d-block']"
    tabindex="-1" role="dialog" aria-labelledby="frappe-modal-label" aria-hidden="true">
    <div class="modal-dialog" role="document">
      <div class="modal-content shadow">
        <div class="modal-header">
          <h5 class="modal-title">{{ title }}</h5>
          <button type="button" class="close" data-dismiss="modal" aria-label="Close" @click="closeModal">
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <div class="modal-body modal-height">
          <component :is="component" v-bind="props" v-on="events"/>
        </div>
        <div class="modal-footer">
          <f-button secondary @click="closeModal">{{ _('Close') }}</f-button>
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
    component: {
      type: Object
    },
    props: {
      type: Object
    },
    events: {
      type: Object
    }
  },
  methods: {
    closeModal() {
      this.$emit('close-modal');
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
