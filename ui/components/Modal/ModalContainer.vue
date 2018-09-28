<template>
  <div class="modal-container">
    <modal
      :key="modal.id"
      v-for="modal in modals"
      v-bind="modal.modalProps"
      @close-modal="onModalClose(modal.id)"
    ></modal>
    <div class="modal-backdrop show" v-show="modals.length"></div>
  </div>
</template>
<script>
import Modal from './Modal';
import Plugin from './plugin';
import ErrorModal from './ErrorModal';
export default {
  name: 'ModalContainer',
  components: {
    Modal
  },
  data() {
    return {
      currentId: 0,
      modals: []
    }
  },
  created() {
    Plugin.modalContainer = this;
    Plugin.event.$on('hide', (id) => {
      if (!id) {
        console.warn(`id not provided in $modal.hide method, the last modal in the stack will be hidden`);
      }
      this.onModalClose(id);
    });
    frappe.events.on('throw', ({ message, stackTrace }) => {
      this.$modal.show({
        modalProps: {
          title: 'Something went wrong',
          noFooter: true
        },
        component: ErrorModal,
        props: {
          message,
          stackTrace
        }
      });
    });
  },
  methods: {
    add({ component, props = {}, events = {}, modalProps = {} }) {
      this.currentId++;
      this.modals.push({
        id: this.currentId,
        modalProps: Object.assign({}, modalProps, {
          component,
          props,
          events
        })
      });
      return this.currentId;
    },
    removeModal(id) {
      if (!id) {
        id = this.currentId;
      }
      this.currentId--;
      this.modals = this.modals.filter(modal => modal.id !== id);
    },
    onModalClose(id) {
      if (id) {
        const modal = this.modals.find(modal => modal.id === id);
        modal.modalProps.events.onClose && modal.modalProps.events.onClose();
      }
      this.removeModal(id);
    }
  }
}
</script>