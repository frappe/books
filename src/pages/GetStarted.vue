<template>
  <div class="flex flex-col overflow-y-hidden">
    <PageHeader :title="t`Setup Your Workspace`" />
    <div class="flex-1 mx-4 overflow-y-auto">
      <div class="my-4" v-for="section in sections" :key="section.label">
        <h2 class="font-medium">{{ section.label }}</h2>
        <div class="flex mt-4 -mx-2">
          <div
            class="flex-shrink-0 w-full px-2 md:w-1/3 sm:w-1/2"
            v-for="item in section.items"
            :key="item.label"
          >
            <div
              class="
                flex flex-col
                justify-between
                h-full
                p-6
                border
                rounded-lg
                cursor-pointer
                hover:shadow-md
              "
              @mouseenter="() => (activeCard = item.key)"
              @mouseleave="() => (activeCard = null)"
            >
              <div>
                <component
                  v-show="activeCard !== item.key && !isCompleted(item)"
                  :is="getIconComponent(item)"
                  class="mb-4"
                />
                <Icon
                  v-show="isCompleted(item)"
                  name="green-check"
                  size="24"
                  class="w-5 h-5 mb-4"
                />
                <h3 class="font-medium">{{ item.label }}</h3>
                <p class="mt-2 text-sm text-gray-800">
                  {{ item.description }}
                </p>
              </div>
              <div
                class="flex mt-2 overflow-hidden"
                v-show="activeCard === item.key && !isCompleted(item)"
              >
                <Button
                  v-if="item.action"
                  class="leading-tight"
                  type="primary"
                  @click="handleAction(item)"
                >
                  <span class="text-base text-white">
                    {{ item.actionLabel || t`Setup` }}
                  </span>
                </Button>
                <Button
                  v-if="item.documentation"
                  class="leading-tight"
                  :class="{ 'ml-4': item.action }"
                  @click="handleDocumentation(item)"
                >
                  <span class="text-base">
                    {{ t`Documentation` }}
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ipcRenderer } from 'electron';
import Button from 'src/components/Button';
import Icon from 'src/components/Icon';
import PageHeader from 'src/components/PageHeader';
import { fyo } from 'src/initFyo';
import { getGetStartedConfig } from 'src/utils/getStartedConfig';
import { IPC_MESSAGES } from 'utils/messages';
import { h } from 'vue';

export default {
  name: 'GetStarted',
  components: {
    PageHeader,
    Button,
    Icon,
  },
  data() {
    return {
      activeCard: null,
      sections: [],
    };
  },
  mounted() {
    this.sections = getGetStartedConfig();
  },
  async activated() {
    await fyo.doc.getSingle('GetStarted');
    this.checkForCompletedTasks();
  },
  methods: {
    async handleDocumentation({ key, documentation }) {
      if (documentation) {
        ipcRenderer.send(IPC_MESSAGES.OPEN_EXTERNAL, documentation);
      }

      switch (key) {
        case 'Opening Balances':
          await this.updateChecks({ openingBalanceChecked: 1 });
          break;
      }
    },
    async handleAction({ key, action }) {
      if (action) {
        action();
        this.activeCard = null;
      }

      switch (key) {
        case 'Invoice':
          await this.updateChecks({ invoiceSetup: 1 });
          break;
        case 'General':
          await this.updateChecks({ companySetup: 1 });
          break;
        case 'System':
          await this.updateChecks({ systemSetup: 1 });
          break;
        case 'Review Accounts':
          await this.updateChecks({ chartOfAccountsReviewed: 1 });
          break;
        case 'Add Taxes':
          await this.updateChecks({ taxesAdded: 1 });
          break;
      }
    },
    async checkIsOnboardingComplete() {
      if (fyo.singles.GetStarted.onboardingComplete) {
        return true;
      }

      const doc = await fyo.doc.getSingle('GetStarted');
      const onboardingComplete = fyo.schemaMap.GetStarted.fields
        .filter(({ fieldname }) => fieldname !== 'onboardingComplete')
        .map(({ fieldname }) => doc.get(fieldname))
        .every(Boolean);

      if (onboardingComplete) {
        await this.updateChecks({ onboardingComplete });
        const systemSettings = await fyo.doc.getSingle('SystemSettings');
        await systemSettings.set({ hideGetStarted: 1 });
        await systemSettings.sync();
      }

      return onboardingComplete;
    },
    async checkForCompletedTasks() {
      let toUpdate = {};
      if (await this.checkIsOnboardingComplete()) {
        return;
      }

      if (!fyo.singles.GetStarted.itemCreated) {
        const count = await fyo.db.count('Item');
        if (count > 0) {
          toUpdate.itemCreated = 1;
        }
      }

      if (!fyo.singles.GetStarted.invoiceCreated) {
        const count = await fyo.db.count('SalesInvoice');
        if (count > 0) {
          toUpdate.invoiceCreated = 1;
        }
      }

      if (!fyo.singles.GetStarted.customerCreated) {
        const count = fyo.db.count('Party', {
          filters: { role: 'Customer' },
        });
        if (count > 0) {
          toUpdate.customerCreated = 1;
        }
      }

      if (!fyo.singles.GetStarted.billCreated) {
        const count = await fyo.db.count('SalesInvoice');
        if (count > 0) {
          toUpdate.billCreated = 1;
        }
      }

      if (!fyo.singles.GetStarted.supplierCreated) {
        const count = fyo.db.count('Party', {
          filters: { role: 'Supplier' },
        });
        if (count > 0) {
          toUpdate.supplierCreated = 1;
        }
      }
      await this.updateChecks(toUpdate);
    },
    async updateChecks(toUpdate) {
      await fyo.singles.GetStarted.setMultiple(toUpdate);
      await fyo.singles.GetStarted.sync();
      fyo.singles.GetStarted = await fyo.doc.getSingle('GetStarted');
    },
    isCompleted(item) {
      return fyo.singles.GetStarted.get(item.fieldname) || 0;
    },
    getIconComponent(item) {
      let completed = fyo.singles.GetStarted[item.fieldname] || 0;
      let name = completed ? 'green-check' : item.icon;
      let size = completed ? '24' : '18';
      return {
        name,
        render() {
          return h(Icon, {
            ...Object.assign(
              {
                name,
                size,
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
