<template>
  <div>
    <div :class="['modal fade', modalClasses]" :style="{display: show ? 'block' : ''}" id="frappe-modal"
      tabindex="-1" role="dialog" aria-labelledby="frappe-modal-label" aria-hidden="true"
    >
      <div class="modal-dialog" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="frappe-modal-label">{{ title }}</h5>
            <button type="button" class="close" data-dismiss="modal" aria-label="Close" @click="closeModal">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div class="modal-body">
            <component :is="body" />
          </div>
          <div class="modal-footer">
            <component :is="footer" />
            <f-button secondary @click="closeModal">Close</f-button>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-backdrop show" v-show="show" @click="closeModal"></div>
  </div>
</template>
<script>
export default {
  props: {
    show: Boolean,
    title: {
      type: String,
      default: 'Modal Title'
    },
    body: {
      type: Object,
      default: null
    },
    footer: {
      type: Object,
      default: null
    }
  },
  computed: {
    modalClasses() {
      return {
        show: this.show
      }
    }
  },
  methods: {
    closeModal() {
      this.$emit('close-modal');
    }
  }
}
</script>
