<template>
  <div class="frappe-form-actions d-flex align-items-center p-3 border-bottom">
    <button  class="btn btn-primary btn-sm back-btn" @click="back">⇦</button>
    <h5 class="m-0">{{ title || name }}</h5>
  </div>
</template>
<script>
export default {
  props: ['doctype', 'name', 'title'],
  methods:{
      back(){
        this.$router.push(`/email/Email/UNSEEN`);
    }
  }
}
</script>
<style>
.back-btn{
    margin-right: 2%;
    position: relative; 
}
</style>