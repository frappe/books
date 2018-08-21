<template>
  <div class="frappe-form-actions d-flex align-items-center p-3 border-bottom">
    <!-- <button  class="btn btn-primary btn-sm back-btn" @click="back">⇦</button> -->
    <h5 class="m-0 text-truncate">{{ title || name }}</h5>
    <button  class="btn btn-primary btn-sm reply-btn" @click="$emit('reply')">Reply</button>
    <!-- <h5 class="m-1">HEllo</h5> -->
  </div>
</template>
<script>
export default {
  props: ['doctype', 'name', 'title','selected'],
  methods: {
  }
};
</script>
<style>
.back-btn {
  margin-right: 2%;
  position: relative;
}
.reply-btn {
  margin-top: 1%;
  margin-left: 1%;
  margin-right: 1%;
  position: absolute;
  top: 0;
  right: 0%;
}
</style>