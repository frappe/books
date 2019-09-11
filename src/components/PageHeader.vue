  <template>
  <div
    class="page-header mx-4 py-2 my-1 bg-white d-flex align-items-center justify-content-between"
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
    <div class="d-flex col-4 py-1 px-0 align-items-center justify-content-end">
      <div v-for="action in actions" :key="action.label" class="mr-2">
        <f-button primary @click="action.clickHandler">
          <div class="px-2">{{ action.label }}</div>
        </f-button>
      </div>
      <SearchBar v-if="hasSearchBar" />
    </div>
  </div>
</template>
<script>
import SearchBar from './SearchBar';

export default {
  props: {
    title: String,
    breadcrumbs: Array,
    actions: Array,
    hasSearchBar: { type: Boolean, default: true }
  },
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
  // margin: auto 30px;
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

button {
  border-radius: $border-radius !important;
}
.btn-sm {
  font-size: 1rem;
}
.btn-primary {
  color: $white;
}
</style>
