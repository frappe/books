<template>
  <div class="input-group">
    <input
      type="search"
      class="form-control"
      placeholder="Search..."
      autocomplete="off"
      spellcheck="false"
      v-model="inputValue"
      @keyup.enter="$emit('change', inputValue)"
      aria-label="Recipient's username"
    >
    <div class="input-group-append">
      <button
        class="btn btn-outline-secondary"
        type="button"
        :disabled="!inputValue"
        @click="clearInput"
      >
        {{ _('Clear') }}
      </button>
    </div>
  </div>
</template>
<script>
export default {
  data() {
    return {
      inputValue: ''
    }
  },
  methods: {
    clearInput() {
      this.inputValue = '';
      this.$emit('change', null);
    }
  }
}
</script>
