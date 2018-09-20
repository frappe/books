<template>
  <div class="dropdown show" ref="dropdownMenu">
      <button
        :id="_uid"
        class="btn btn-sm btn-light dropdown-toggle"
        aria-haspopup="true"
        :aria-expanded="isShown ? 'true' : 'false'"
        @click="isShown = !isShown"
      >
        {{ label }}
      </button>
      <div :class="['dropdown-menu dropdown-menu-right', isShown ? 'show' : '']" :aria-labelledby="_uid">
        <a
          href="#"
          class="dropdown-item"
          v-for="option in options"
          :key="option.label"
          @click.prevent="option.handler"
        >
          {{ option.label }}
        </a>
      </div>
  </div>
</template>
<script>
export default {
  props: ['label', 'options'],
  data() {
    return {
      isShown: false
    }
  },
  methods:{
      documentClick(e) {
        let el = this.$refs.dropdownMenu;
        let target = e.target;
        if ((el !== target) && (!el.contains(target))) {
          this.isShown = false;
        }
      }
    },
    created () {
      document.addEventListener('click', this.documentClick);
    },
    destroyed () {
      document.removeEventListener('click', this.documentClick);
    }
};
</script>
<style lang="scss">
@import "../styles/variables.scss";
$dropdown-link-active-bg: $gray-300;

.dropdown-item {
  &.active,
  &:active {
    @include gradient-bg($dropdown-link-active-bg);
  }
}

</style>
