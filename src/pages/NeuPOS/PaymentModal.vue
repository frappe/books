<template>
  <Modal class="w-2/5 ml-auto mr-3.5" :open-modal="openModal">
    <div class="px-4 py-6 grid" style="height: 95vh">
      Lorem, ipsum dolor sit amet consectetur adipisicing elit. Odit, cumque.
    </div>
  </Modal>
</template>

<script>
import Modal from 'src/components/Modal.vue';
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'PaymentModal',
  components: { Modal },
});
</script>
