<template>
	<nav class="frappe-navbar navbar navbar-light bg-light row no-gutters border-bottom">
		<form v-if="showSearch" class="form-inline col-4 pr-3">
			<input type="text"
				v-model="searchValue"
				@input="updateSearch"
				name="search"
				class="form-control shadow-none w-100"
				:placeholder="_('Search...')">
		</form>
		<div class="navbar-text">&nbsp;</div>
	</nav>
</template>
<script>
import { debounce } from 'lodash';
export default {
  data() {
    return {
        searchValue: ''
    };
  },
  computed: {
    showSearch() {
      // TODO: Make this configurable
      return /list|edit/.test(this.$route.path)
    }
  },
  mounted() {
    this.$root.$on('newList', () => this.searchValue = '')
  },
  methods: {
    updateSearch: debounce(function() {
      this.$root.$emit('navbarSearch', this.searchValue)
    }, 500)
  }
};
</script>
