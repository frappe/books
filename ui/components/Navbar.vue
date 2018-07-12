<template>
	<nav class="frappe-navbar navbar navbar-light bg-light row no-gutters border-bottom border-top">
		<form v-if="showSearch" class="form-inline col-4 pr-3">
			<input type="text"
				v-model="searchValue"
				@input="updateSearch"
				name="search"
				class="form-control shadow-none w-100"
				placeholder="Search...">
		</form>
		<div class="navbar-text">HI</div>
	</nav>
</template>
<script>
import { debounce } from 'lodash';
export default {
    props: ["showSearch"],
    data() {
        return {
            searchValue: ''
        };
    },
    mounted() {
        this.$root.$on('newList', () => this.searchValue = '')
    },
    methods: {
        updateSearch: debounce(function() {
            this.$root.$emit("search", this.searchValue);
        }, 500)
    }
};
</script>
