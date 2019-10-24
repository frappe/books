<template>
  <div class="flex flex-col flex-1">
    <div class="bg-gray-200 window-drag pb-2">
      <div class="p-2">
        <WindowControls />
      </div>
      <Row :columnCount="5" class="px-6" gap="0.5rem">
        <div
          v-for="(tab, i) in tabs"
          :key="tab.label"
          class="p-2 rounded-6px hover:bg-white flex flex-col items-center justify-center cursor-pointer"
          :class="i === activeTab && 'bg-white shadow text-blue-500'"
          @click="activeTab = i"
        >
          <component :is="getIconComponent(tab)" />
          <div class="mt-2 text-xs">{{ tab.label }}</div>
        </div>
      </Row>
    </div>
    <div class="bg-white flex-1 p-6">
      <component :is="activeTabComponent" />
    </div>
  </div>
</template>
<script>
import { _ } from 'frappejs/utils';
import WindowControls from '@/components/WindowControls';
import TabGeneral from './TabGeneral.vue';
import Row from '@/components/Row';

export default {
  name: 'Settings',
  components: {
    WindowControls,
    TabGeneral,
    Row
  },
  data() {
    return {
      activeTab: 0,
      tabs: [
        {
          label: _('General'),
          icon: `<svg class="w-6 h-6" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <g fill="none" fill-rule="evenodd">
              <path d="M18.94 13.94l4.025 4.024a3.535 3.535 0 11-5 5l-4.518-4.518 3.641-4.499c.304.035.607.053.912.053.318 0 .631-.024.94-.06zM4 0l4 4-1.293 1.293 2.378 2.378-1.522 1.306-2.27-2.27L4 8 0 4l4-4z" fill="#A1ABB4"/>
              <path d="M20.271 6.771l-3.042-3.042L20.437.521A5.97 5.97 0 0018 0a6 6 0 00-5.75 7.708l-10.789 8.73a4.335 4.335 0 00-1.459 3.106 4.335 4.335 0 001.264 3.19 4.325 4.325 0 006.296-.195l8.73-10.789A6 6 0 0024 6c0-.869-.189-1.692-.521-2.438l-3.208 3.209z" fill="#415668"/>
            </g>
          </svg>`,
          component: TabGeneral
        },
        {
          label: _('Mail'),
          icon: `<svg class="w-6 h-6" viewBox="0 0 24 20" xmlns="http://www.w3.org/2000/svg">
            <g fill="none" fill-rule="evenodd">
              <path d="M13.4 12.6a2.3 2.3 0 01-1.4.4 2.3 2.3 0 01-1.4-.4L0 6.9V17a3 3 0 003 3h18a3 3 0 003-3V6.9l-10.6 5.7z" fill="#415668"/>
              <path d="M21 0H3a3 3 0 00-3 3v1a1.05 1.05 0 00.5.9l11 6a.9.9 0 00.5.1.9.9 0 00.5-.1l11-6A1.05 1.05 0 0024 4V3a3 3 0 00-3-3z" fill="#A1ABB4"/>
            </g>
          </svg>`
        },
        {
          label: _('Invoice'),
          icon: `<svg class="w-6 h-6" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <g fill="none" fill-rule="evenodd">
              <path d="M20.7 15.6l2.85 2.85c.3.3.45.6.45 1.05V24h-4.5c-.45 0-.75-.15-1.05-.45L15.6 20.7l5.1-5.1zM3.45.45c.6-.6 1.5-.6 2.1 0L8.4 3.3 3.3 8.4.45 5.55c-.6-.6-.6-1.5 0-2.1z" fill="#A1ABB4"/>
              <path d="M23.55 6.45l-6-6c-.6-.6-1.5-.6-2.1 0L13.5 2.4l2.55 2.55-2.1 2.1L11.4 4.5 9 6.9l2.55 2.55-2.1 2.1L6.9 9l-2.4 2.4 2.55 2.55-2.1 2.1L2.4 13.5.45 15.45c-.6.6-.6 1.5 0 2.1l6 6c.6.6 1.5.6 2.1 0l15-15c.6-.6.6-1.5 0-2.1z" fill="#415668"/>
            </g>
          </svg>`
        },
        {
          label: _('System'),
          icon: `<svg class="w-6 h-6" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M20.872 13.453c.082-.48.125-.966.128-1.453a9.033 9.033 0 00-.128-1.453l2.1-2.029a1 1 0 00.171-1.218l-1.5-2.6a1.009 1.009 0 00-1.143-.461l-2.8.8a9.017 9.017 0 00-2.527-1.451L14.47.758A1 1 0 0013.5 0h-3a1 1 0 00-.97.758l-.707 2.83A9.017 9.017 0 006.3 5.039l-2.8-.8a1.01 1.01 0 00-1.143.461l-1.5 2.6a1 1 0 00.171 1.219l2.1 2.029c-.082.48-.125.965-.128 1.452.003.487.046.973.128 1.453l-2.1 2.029A1 1 0 00.857 16.7l1.5 2.6a1 1 0 001.142.462l2.8-.8a9.017 9.017 0 002.527 1.451l.707 2.83A1 1 0 0010.5 24h3a1 1 0 00.97-.758l.707-2.83a9.017 9.017 0 002.523-1.451l2.8.8a1 1 0 001.142-.462l1.5-2.6a1 1 0 00-.171-1.219l-2.099-2.027zM12 16a4 4 0 110-8 4 4 0 010 8z" fill="#415668" fill-rule="evenodd"/>
          </svg>`
        },
        {
          label: _('Privacy'),
          icon: `<svg class="w-6 h-6" viewBox="0 0 22 24" xmlns="http://www.w3.org/2000/svg">
            <g fill="#415668" fill-rule="evenodd">
              <path d="M20.618 2.111L11.226.024a1.069 1.069 0 00-.453 0L1.382 2.111c-.478.106-.817.53-.817 1.02v10.434C.565 19.328 5.237 24 11 24c5.763 0 10.435-4.672 10.435-10.435V3.13c0-.489-.34-.913-.817-1.019zm-4.4 14.585c0 .576-.468 1.043-1.044 1.043H6.826a1.043 1.043 0 01-1.044-1.043v-5.218c0-.576.468-1.043 1.044-1.043h1.043V8.348a3.13 3.13 0 116.261 0v2.087h1.044c.576 0 1.043.467 1.043 1.043v5.218z"/>
              <path d="M11 7.304c-.577 0-1.044.468-1.044 1.044v2.087h2.087V8.348c0-.576-.467-1.044-1.043-1.044z"/>
            </g>
          </svg>`
        }
      ]
    };
  },
  methods: {
    getIconComponent(tab) {
      return {
        template: tab.icon
      };
    },
  },
  computed: {
    activeTabComponent() {
      return this.tabs[this.activeTab].component;
    }
  }
};
</script>
