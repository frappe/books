<template>
  <FormContainer :title="t`Settings`" :searchborder="false">
    <template #body>
      <!-- Icon Tab Bar -->
      <div class="flex m-4 mb-0 gap-8">
        <button
          v-for="(tab, i) in tabs"
          :key="tab.label"
          class="
            hover:bg-white
            flex flex-col
            items-center
            justify-center
            cursor-pointer
            text-sm
          "
          :class="
            i === activeTab &&
            'text-blue-500 font-semibold border-b-2 border-blue-500'
          "
          :style="{
            paddingBottom: i === activeTab ? 'calc(1rem - 2px)' : '1rem',
          }"
          @click="activeTab = i"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Component -->
      <div class="flex-1 overflow-y-auto custom-scroll">
        <component
          :is="tabs[activeTab].component"
          :schema-name="tabs[activeTab].schemaName"
          @change="handleChange"
        />
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
import TabBase from './TabBase.vue';
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
          schemaName: 'PrintSettings',
          component: markRaw(TabInvoice),
        },
        {
          key: 'General',
          label: t`General`,
          schemaName: 'AccountingSettings',
          component: markRaw(TabGeneral),
        },
        {
          key: 'Defaults',
          label: t`Defaults`,
          schemaName: 'Defaults',
          component: markRaw(TabBase),
        },
        {
          key: 'Inventory',
          label: t`Inventory`,
          schemaName: 'InventorySettings',
          component: markRaw(TabBase),
        },
        {
          key: 'System',
          label: t`System`,
          schemaName: 'SystemSettings',
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
};
</script>
