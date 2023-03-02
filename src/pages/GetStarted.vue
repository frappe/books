<template>
  <div class="flex flex-col overflow-y-hidden">
    <PageHeader :title="t`Set Up Your Workspace`" />
    <div class="flex-1 overflow-y-auto overflow-x-hidden custom-scroll">
      <div
        class="p-4 border-b"
        v-for="section in sections"
        :key="section.label"
      >
        <h2 class="font-medium">{{ section.label }}</h2>
        <div class="flex mt-4 gap-4">
          <div
            class="w-full md:w-1/3 sm:w-1/2"
            v-for="item in section.items"
            :key="item.label"
          >
            <div
              class="flex flex-col justify-between h-40 p-4 border rounded-lg"
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
                    {{ item.actionLabel || t`Set Up` }}
                  </span>
                </Button>
                <Button
                  v-if="item.documentation"
                  class="leading-tight"
                  :class="{ 'ms-4': item.action }"
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
import Button from 'src/components/Button';
import Icon from 'src/components/Icon';
import PageHeader from 'src/components/PageHeader';
import { fyo } from 'src/initFyo';
import { getGetStartedConfig } from 'src/utils/getStartedConfig';
import { openLink } from 'src/utils/ipcCalls';
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
    await fyo.doc.getDoc('GetStarted');
    this.checkForCompletedTasks();
  },
  methods: {
    async handleDocumentation({ key, documentation }) {
      if (documentation) {
        openLink(documentation);
      }

      switch (key) {
        case 'Opening Balances':
          await this.updateChecks({ openingBalanceChecked: true });
          break;
      }
    },
    async handleAction({ key, action }) {
      if (action) {
        action();
        this.activeCard = null;
      }

      switch (key) {
        case 'Print':
          await this.updateChecks({ printSetup: true });
          break;
        case 'General':
          await this.updateChecks({ companySetup: true });
          break;
        case 'System':
          await this.updateChecks({ systemSetup: true });
          break;
        case 'Review Accounts':
          await this.updateChecks({ chartOfAccountsReviewed: true });
          break;
        case 'Add Taxes':
          await this.updateChecks({ taxesAdded: true });
          break;
      }
    },
    async checkIsOnboardingComplete() {
      if (fyo.singles.GetStarted.onboardingComplete) {
        return true;
      }

      const doc = await fyo.doc.getDoc('GetStarted');
      const onboardingComplete = fyo.schemaMap.GetStarted.fields
        .filter(({ fieldname }) => fieldname !== 'onboardingComplete')
        .map(({ fieldname }) => doc.get(fieldname))
        .every(Boolean);

      if (onboardingComplete) {
        await this.updateChecks({ onboardingComplete });
        const systemSettings = await fyo.doc.getDoc('SystemSettings');
        await systemSettings.set('hideGetStarted', true);
        await systemSettings.sync();
      }

      return onboardingComplete;
    },
    async checkForCompletedTasks() {
      let toUpdate = {};
      if (await this.checkIsOnboardingComplete()) {
        return;
      }

      if (!fyo.singles.GetStarted.salesItemCreated) {
        const count = await fyo.db.count('Item', { filters: { for: 'Sales' } });
        toUpdate.salesItemCreated = count > 0;
      }

      if (!fyo.singles.GetStarted.purchaseItemCreated) {
        const count = await fyo.db.count('Item', {
          filters: { for: 'Purchases' },
        });
        toUpdate.purchaseItemCreated = count > 0;
      }

      if (!fyo.singles.GetStarted.invoiceCreated) {
        const count = await fyo.db.count('SalesInvoice');
        toUpdate.invoiceCreated = count > 0;
      }

      if (!fyo.singles.GetStarted.customerCreated) {
        const count = await fyo.db.count('Party', {
          filters: { role: 'Customer' },
        });
        toUpdate.customerCreated = count > 0;
      }

      if (!fyo.singles.GetStarted.billCreated) {
        const count = await fyo.db.count('SalesInvoice');
        toUpdate.billCreated = count > 0;
      }

      if (!fyo.singles.GetStarted.supplierCreated) {
        const count = await fyo.db.count('Party', {
          filters: { role: 'Supplier' },
        });
        toUpdate.supplierCreated = count > 0;
      }
      await this.updateChecks(toUpdate);
    },
    async updateChecks(toUpdate) {
      await fyo.singles.GetStarted.setAndSync(toUpdate);
      await fyo.doc.getDoc('GetStarted');
    },
    isCompleted(item) {
      return fyo.singles.GetStarted.get(item.fieldname) || false;
    },
    getIconComponent(item) {
      let completed = fyo.singles.GetStarted[item.fieldname] || false;
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
