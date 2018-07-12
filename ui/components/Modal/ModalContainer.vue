<template>
  <div class="modal-container">
    <modal
      :key="modal.id"
      v-for="modal in modals"
      v-bind="modal"
      @close-modal="onModalClose(modal.id)"
    ></modal>
    <div class="modal-backdrop show" v-show="modals.length"></div>
  </div>
</template>
<script>
import Modal from './Modal';
import Plugin from './plugin';

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
  },
  methods: {
    add(component, props, events) {
      this.currentId++;
      this.modals.push({
        id: this.currentId,
        component,
        props,
        events
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
        modal.props.onClose && modal.props.onClose();
      }
      this.removeModal(id);
    }
  }
}
</script>
