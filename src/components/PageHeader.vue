<template>
  <div
    class="page-header px-4 py-2 border-bottom bg-white d-flex align-items-center justify-content-between"
  >
    <h5 class="m-0" v-if="title">{{ title }}</h5>
    <div v-if="breadcrumbs">
      <span v-for="(item, index) in breadcrumbs" :key="index">
        <a v-if="item.route.length != 0" :href="item.route">
          <h5 class="breadCrumbRoute">{{ item.title }}</h5>
        </a>
        <h5 v-else class="breadCrumbRoute">{{ item.title }}</h5>
        <feather-icon
          v-if="index != breadcrumbs.length - 1"
          name="chevron-right"
          style="color: #212529 !important;"
        ></feather-icon>
      </span>
    </div>
    <div class="col-4 p-1">
      <SearchBar />
    </div>
  </div>
</template>
<script>
import SearchBar from './SearchBar';

export default {
  props: ['title', 'breadcrumbs'],
  components: {
    SearchBar
  },
  computed: {
    clickableBreadcrumbs() {
      return this.breadcrumbs.slice(0, this.breadcrumbs.length - 1);
    },
    lastBreadcrumb() {
      return this.breadcrumbs[this.breadcrumbs.length - 1];
    }
  }
};
</script>
<style lang="scss">
@import '../styles/variables.scss';
.page-header {
  position: sticky;
  top: 0;
  z-index: 10;
}
.breadCrumbRoute {
  display: inline;
}
a {
  text-decoration: none;
  color: #212529;
  &:hover {
    text-decoration: none;
    color: $frappe;
  }
}
.feather-icon {
  position: relative;
  bottom: -2px;
}
</style>
