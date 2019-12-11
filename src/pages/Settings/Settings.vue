<template>
  <div class="flex flex-col flex-1 overflow-hidden">
    <div class="bg-gray-200 window-drag pb-2">
      <div class="p-2">
        <WindowControls
          @close="frappe.events.trigger('reload-main-window')"
          :buttons="['close']"
        />
      </div>
      <Row :columnCount="5" class="px-6 border-none w-full" gap="0.5rem">
        <div
          v-for="(tab, i) in tabs"
          :key="tab.label"
          class="p-2 rounded-md hover:bg-white flex flex-col items-center justify-center cursor-pointer"
          :class="i === activeTab && 'bg-white shadow text-blue-500'"
          @click="activeTab = i"
        >
          <component :is="getIconComponent(tab)" />
          <div class="mt-2 text-xs">{{ tab.label }}</div>
        </div>
      </Row>
    </div>
    <div class="bg-white flex-1 p-6 overflow-y-auto">
      <component :is="activeTabComponent" />
    </div>
  </div>
</template>
<script>
import { _ } from 'frappejs/utils';
import WindowControls from '@/components/WindowControls';
import TabGeneral from './TabGeneral.vue';
import TabSystem from './TabSystem.vue';
import TabInvoice from './TabInvoice.vue';
import Row from '@/components/Row';
import Icon from '@/components/Icon';

export default {
  name: 'Settings',
  components: {
    WindowControls,
    Row
  },
  data() {
    return {
      activeTab: 0,
      tabs: [
        {
          label: _('General'),
          icon: 'general',
          component: TabGeneral
        },
        // {
        //   label: _('Mail'),
        //   icon: 'mail'
        // },
        {
          label: _('Invoice'),
          icon: 'invoice',
          component: TabInvoice
        },
        {
          label: _('System'),
          icon: 'system',
          component: TabSystem
        },
        // {
        //   label: _('Privacy'),
        //   icon: 'privacy'
        // }
      ]
    };
  },
  mounted() {
    let path = this.$router.currentRoute.fullPath;
    let tab = path.replace('/settings/', '');
    let index = this.tabs.findIndex(t => t.label === _(tab));
    if (index !== -1) {
      this.activeTab = index;
    }
  },
  methods: {
    getIconComponent(tab) {
      return {
        render(h) {
          return h(Icon, {
            class: 'w-6 h-6',
            props: {
              name: tab.icon,
              size: '24'
            }
          });
        }
      };
    }
  },
  computed: {
    activeTabComponent() {
      return this.tabs[this.activeTab].component;
    }
  }
};
</script>
