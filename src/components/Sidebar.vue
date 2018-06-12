<template>
    <div class="frappe-sidebar col-2 bg-light border-right">
        <div class="navbar border-bottom">
            <div class="navbar-text">
                TennisMart
            </div>
        </div>
        <div class="my-3" v-for="(sidebarGroup, index) in sidebarConfig" :key="index">
            <h6 v-if="sidebarGroup.title" class="sidebar-heading nav-link text-muted text-uppercase m-0">
                {{ sidebarGroup.title }}
            </h6>
            <nav class="nav flex-column">
                <li class="nav-item">
                    <a v-for="item in sidebarGroup.items" :key="item.route"
                        :href="item.route"
                        :class="['nav-link', isActive(item) ? 'text-light bg-secondary' : 'text-dark']" 
                    >
                        {{ item.label }}
                    </a>
                </li>
            </nav>
        </div>
    </div>
</template>
<script>
import sidebar from '../sidebar';

export default {
    data() {
        return {
            sidebarConfig: sidebar
        }
    },
    methods: {
        isActive(item) {
            if (this.$route.params.doctype) {
                return this.$route.params.doctype === item.label;
            }
            const route = item.route.slice(1);
            return this.$route.params.doctype === route;
        }
    }
}
</script>

<style>
.frappe-sidebar {
    min-height: calc(100vh);
}

.sidebar-heading {
    font-size: 0.8rem;
}
</style>
