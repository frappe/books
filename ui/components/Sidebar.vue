<template>
  <div class="frappe-sidebar col-2 bg-light border-right">
    <div class="navbar border-bottom navbar-title" @click="toggleDropdown">
      <span class="d-flex align-items-center justify-content-between text-truncate w-100">
        <div class="navbar-text text-truncate">
          {{ title }}
        </div>
        <feather-icon style="height: 16px" name="chevron-down" />
      </span>
      <div :class="['dropdown-menu shadow w-100', showDropdown ? 'show' : '']">
        <a
          href="#"
          class="dropdown-item"
          v-for="option in sidebarConfig.titleDropdownItems"
          :key="option.label"
          @click.prevent="titleDropdownItemClick(option.handler)"
        >
          {{ option.label }}
        </a>
      </div>
    </div>
    <div class="my-3" v-for="(sidebarGroup, index) in sidebarConfig.groups" :key="index">
      <h6 v-if="sidebarGroup.title" class="sidebar-heading nav-link text-muted text-uppercase m-0">
        {{ sidebarGroup.title }}
      </h6>
      <nav class="nav flex-column">
        <li class="nav-item">
          <a v-for="item in sidebarGroup.items" :key="item.route"
            :href="item.route"
            :class="['nav-link', isActive(item) ? 'text-light bg-secondary' : 'text-dark']" >
            {{ item.label }}
          </a>
        </li>
      </nav>
    </div>
  </div>
</template>
<script>
export default {
  props: ['sidebarConfig'],
  data() {
    return {
      title: '',
      showDropdown: false
    }
  },
  async created() {
    this.title = await this.sidebarConfig.getTitle();
  },
  methods: {
    isActive(item) {
      if (this.$route.params.doctype) {
          return this.$route.params.doctype === item.label;
      }
      const route = item.route.slice(1);
      return this.$route.path === route;
    },
    titleDropdownItemClick(handler) {
      handler(this);
    },
    toggleDropdown(e) {
      this.showDropdown = !this.showDropdown;
    }
  }
}
</script>

<style lang="scss">
@import "../styles/variables";

.frappe-sidebar {
    min-height: calc(100vh);
}

.sidebar-heading {
    font-size: 0.8rem;
}

.navbar-title {
  cursor: pointer;
}
.navbar-title:hover {
  background-color: $gray-200;
}
</style>
