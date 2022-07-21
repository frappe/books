<template>
  <FormContainer :title="t`Settings`" :searchborder="false">
    <template #body>
      <!-- Icon Tab Bar -->
      <div class="flex justify-around mb-2 mt-4">
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
          <component :is="getIconComponent(tab)" :active="i === activeTab" />
          <div class="mt-2 text-xs">{{ tab.label }}</div>
        </div>
      </div>
      <div class="flex-1 overflow-y-auto">
        <component :is="activeTabComponent" @change="handleChange" />
      </div>
    </template>
  </FormContainer>
</template>
<script>
import { ipcRenderer } from 'electron';
import { t } from 'fyo';
import Button from 'src/components/Button.vue';
import FormContainer from 'src/components/FormContainer.vue';
import Icon from 'src/components/Icon.vue';
import PageHeader from 'src/components/PageHeader.vue';
import Row from 'src/components/Row.vue';
import StatusBadge from 'src/components/StatusBadge.vue';
import { docsPathMap } from 'src/utils/misc';
import { docsPath, showToast } from 'src/utils/ui';
import { IPC_MESSAGES } from 'utils/messages';
import { h, markRaw } from 'vue';
import TabGeneral from './TabGeneral.vue';
import TabInvoice from './TabInvoice.vue';
import TabSystem from './TabSystem.vue';

export default {
  name: 'Settings',
  components: {
    PageHeader,
    StatusBadge,
    Button,
    Row,
    FormContainer,
  },
  data() {
    return {
      activeTab: 0,
      updated: false,
      fieldsChanged: [],
      tabs: [
        {
          key: 'Invoice',
          label: t`Invoice`,
          icon: 'invoice',
          component: markRaw(TabInvoice),
        },
        {
          key: 'General',
          label: t`General`,
          icon: 'general',
          component: markRaw(TabGeneral),
        },
        {
          key: 'System',
          label: t`System`,
          icon: 'system',
          component: markRaw(TabSystem),
        },
      ],
    };
  },
  activated() {
    this.setActiveTab();
    docsPath.value = docsPathMap.Settings;
  },
  deactivated() {
    docsPath.value = '';
    if (this.fieldsChanged.length === 0) {
      return;
    }
    const fieldnames = this.fieldsChanged.map(({ fieldname }) => fieldname);

    if (
      fieldnames.includes('displayPrecision') ||
      fieldnames.includes('hideGetStarted') ||
      fieldnames.includes('displayPrecision') ||
      fieldnames.includes('enableDiscounting')
    ) {
      this.showReloadToast();
    }
  },
  methods: {
    showReloadToast() {
      showToast({
        message: t`Settings changes will be visible on reload`,
        actionText: t`Reload App`,
        type: 'info',
        action: async () => {
          ipcRenderer.send(IPC_MESSAGES.RELOAD_MAIN_WINDOW);
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
      const index = this.tabs.findIndex((i) => i.key === tab);
      if (index !== -1) {
        this.activeTab = index;
      } else {
        this.activeTab = 0;
      }
    },
    getIconComponent(tab) {
      return {
        render() {
          return h(Icon, {
            class: 'w-6 h-6',
            ...Object.assign(
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
