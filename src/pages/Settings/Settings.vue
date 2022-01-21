<template>
  <div class="flex flex-col overflow-hidden">
    <PageHeader>
      <h1 slot="title" class="text-2xl font-bold">
        {{ _('Settings') }}
      </h1>
    </PageHeader>
    <div class="flex justify-center flex-1 mb-8 mt-2">
      <div
        class="border rounded-lg shadow h-full flex flex-col justify-between"
        style="width: 600px"
      >
        <div class="pb-2 mt-8">
          <Row
            :columnCount="tabs.length"
            class="px-6 border-none w-full"
            gap="0.5rem"
          >
            <div
              v-for="(tab, i) in tabs"
              :key="tab.label"
              class="
                p-2
                rounded-md
                hover:bg-white
                flex flex-col
                items-center
                justify-center
                cursor-pointer
              "
              :class="i === activeTab && 'text-blue-500'"
              @click="activeTab = i"
            >
              <component
                :is="getIconComponent(tab)"
                :active="i === activeTab"
              />
              <div class="mt-2 text-xs">{{ tab.label }}</div>
            </div>
          </Row>
        </div>
        <div class="flex-1 p-6 overflow-y-auto">
          <component :is="activeTabComponent" @change="handleChange" />
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import { _ } from 'frappe/utils';
import frappe from 'frappe';
import WindowControls from '@/components/WindowControls';
import TabGeneral from './TabGeneral.vue';
import TabSystem from './TabSystem.vue';
import TabInvoice from './TabInvoice.vue';
import Button from '@/components/Button';
import Row from '@/components/Row';
import Icon from '@/components/Icon';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import { callInitializeMoneyMaker } from '../../utils';
import { showToast } from '../../utils';

export default {
  name: 'Settings',
  components: {
    PageHeader,
    WindowControls,
    StatusBadge,
    Button,
    Row,
  },
  data() {
    return {
      activeTab: 0,
      updated: false,
      fieldsChanged: [],
      tabs: [
        {
          label: _('Invoice'),
          icon: 'invoice',
          component: TabInvoice,
        },
        {
          label: _('General'),
          icon: 'general',
          component: TabGeneral,
        },
        {
          label: _('System'),
          icon: 'system',
          component: TabSystem,
        },
      ],
    };
  },
  activated() {
    this.setActiveTab();
  },
  deactivated() {
    if (this.fieldsChanged.length === 0) {
      return;
    }
    const fieldnames = this.fieldsChanged.map(({ fieldname }) => fieldname);

    if (
      fieldnames.includes('displayPrecision') ||
      fieldnames.includes('hideGetStarted')
    ) {
      callInitializeMoneyMaker(undefined, true);
      this.showReloadToast();
    }
  },
  methods: {
    showReloadToast() {
      showToast({
        message: _('Settings changes will be visible on reload'),
        actionText: frappe._('Reload App'),
        type: 'info',
        action: async () => {
          frappe.events.trigger('reload-main-window');
        },
      });
    },
    handleChange(df, newValue, oldValue) {
      if (!df) {
        return;
      }

      this.fieldsChanged.push(df);
    },
    setActiveTab() {
      const { tab } = this.$route.query;
      const index = this.tabs.findIndex((t) => t.label === _(tab || 'Invoice'));
      if (index !== -1) {
        this.activeTab = index;
      }
    },
    getIconComponent(tab) {
      return {
        render(h) {
          return h(Icon, {
            class: 'w-6 h-6',
            props: Object.assign(
              {
                name: tab.icon,
                size: '24',
              },
              this.$attrs
            ),
          });
        },
      };
    },
  },
  computed: {
    activeTabComponent() {
      return this.tabs[this.activeTab].component;
    },
  },
};
</script>
