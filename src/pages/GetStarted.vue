<template>
  <div class="flex flex-col overflow-y-hidden">
    <PageHeader>
      <template #title>
        <h1 class="text-2xl font-bold">
          {{ t`Setup your workspace` }}
        </h1>
      </template>
    </PageHeader>
    <div class="px-8">
      <div class="border-t"></div>
    </div>
    <div class="flex-1 px-8 overflow-y-auto">
      <div class="my-6" v-for="section in sections" :key="section.label">
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
import Button from '@/components/Button';
import Icon from '@/components/Icon';
import PageHeader from '@/components/PageHeader';
import { openSettings, routeTo } from '@/utils';
import { ipcRenderer } from 'electron';
import frappe, { t } from 'frappe';
import { IPC_MESSAGES } from 'utils/messages';
import { h } from 'vue';

export default {
  name: 'GetStarted',
  components: {
    PageHeader,
    Button,
    Icon,
  },
  computed: {
    sections() {
      /* eslint-disable vue/no-side-effects-in-computed-properties */
      return [
        {
          label: t`Organisation`,

          items: [
            {
              key: 'Invoice',
              label: t`Invoice`,
              icon: 'invoice',
              description: t`Customize your invoices by adding a logo and address details`,
              fieldname: 'invoiceSetup',
              action() {
                openSettings('Invoice');
              },
            },
            {
              key: 'General',
              label: t`General`,
              icon: 'general',
              description: t`Setup your company information, email, country and fiscal year`,
              fieldname: 'companySetup',
              action() {
                openSettings('General');
              },
            },
            {
              key: 'System',
              label: t`System`,
              icon: 'system',
              description: t`Setup system defaults like date format and display precision`,
              fieldname: 'systemSetup',
              action() {
                openSettings('System');
              },
            },
          ],
        },
        {
          label: t`Accounts`,

          items: [
            {
              key: 'Review Accounts',
              label: t`Review Accounts`,
              icon: 'review-ac',
              description: t`Review your chart of accounts, add any account or tax heads as needed`,
              action: () => {
                routeTo('/chart-of-accounts');
              },
              fieldname: 'chartOfAccountsReviewed',
              documentation:
                'https://frappebooks.com/docs/setting-up#1-enter-bank-accounts',
            },
            {
              key: 'Opening Balances',
              label: t`Opening Balances`,
              icon: 'opening-ac',
              fieldname: 'openingBalanceChecked',
              description: t`Setup your opening balances before performing any accounting entries`,
              documentation:
                'https://frappebooks.com/docs/setting-up#5-setup-opening-balances',
            },
            {
              key: 'Add Taxes',
              label: t`Add Taxes`,
              icon: 'percentage',
              fieldname: 'taxesAdded',
              description: t`Setup your tax templates for your sales or purchase transactions`,
              action: () => routeTo('/list/Tax'),
              documentation:
                'https://frappebooks.com/docs/setting-up#2-add-taxes',
            },
          ],
        },
        {
          label: t`Sales`,

          items: [
            {
              key: 'Add Sales Items',
              label: t`Add Items`,
              icon: 'item',
              description: t`Add products or services that you sell to your customers`,
              action: () => routeTo('/list/Item'),
              fieldname: 'itemCreated',
              documentation:
                'https://frappebooks.com/docs/setting-up#3-add-items',
            },
            {
              key: 'Add Customers',
              label: t`Add Customers`,
              icon: 'customer',
              description: t`Add a few customers to create your first invoice`,
              action: () => routeTo('/list/Customer'),
              fieldname: 'customerCreated',
              documentation:
                'https://frappebooks.com/docs/setting-up#4-add-customers',
            },
            {
              key: 'Create Invoice',
              label: t`Create Invoice`,
              icon: 'sales-invoice',
              description: t`Create your first invoice and mail it to your customer`,
              action: () => routeTo('/list/SalesInvoice'),
              fieldname: 'invoiceCreated',
              documentation: 'https://frappebooks.com/docs/invoices',
            },
          ],
        },
        {
          label: t`Purchase`,

          items: [
            {
              key: 'Add Purchase Items',
              label: t`Add Items`,
              icon: 'item',
              description: t`Add products or services that you buy from your suppliers`,
              action: () => routeTo('/list/Item'),
              fieldname: 'itemCreated',
            },
            {
              key: 'Add Suppliers',
              label: t`Add Suppliers`,
              icon: 'supplier',
              description: t`Add a few suppliers to create your first bill`,
              action: () => routeTo('/list/Supplier'),
              fieldname: 'supplierCreated',
            },
            {
              key: 'Create Bill',
              label: t`Create Bill`,
              icon: 'purchase-invoice',
              description: t`Create your first bill and mail it to your supplier`,
              action: () => routeTo('/list/PurchaseInvoice'),
              fieldname: 'billCreated',
              documentation: 'https://frappebooks.com/docs/bills',
            },
          ],
        },
      ];
    },
  },
  data() {
    return {
      activeCard: null,
    };
  },
  async activated() {
    frappe.GetStarted = await frappe.getSingle('GetStarted');
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
      if (frappe.GetStarted.onboardingComplete) {
        return true;
      }

      const meta = await frappe.getMeta('GetStarted');
      const doc = await frappe.getSingle('GetStarted');
      const onboardingComplete = !!meta.fields
        .filter(({ fieldname }) => fieldname !== 'onboardingComplete')
        .map(({ fieldname }) => doc.get(fieldname))
        .every(Boolean);

      if (onboardingComplete) {
        await this.updateChecks({ onboardingComplete });
        const systemSettings = await frappe.getSingle('SystemSettings');
        await systemSettings.set({ hideGetStarted: 1 });
        await systemSettings.update();
      }

      return onboardingComplete;
    },
    async checkForCompletedTasks() {
      let toUpdate = {};
      if (await this.checkIsOnboardingComplete()) {
        return;
      }

      if (!frappe.GetStarted.itemCreated) {
        const count = await frappe.db.count('Item');
        if (count > 0) {
          toUpdate.itemCreated = 1;
        }
      }

      if (!frappe.GetStarted.invoiceCreated) {
        const count = await frappe.db.count('SalesInvoice');
        if (count > 0) {
          toUpdate.invoiceCreated = 1;
        }
      }

      if (!frappe.GetStarted.customerCreated) {
        const count = frappe.db.count('Party', {
          filters: { role: 'Customer' },
        });
        if (count > 0) {
          toUpdate.customerCreated = 1;
        }
      }

      if (!frappe.GetStarted.billCreated) {
        const count = await frappe.db.count('SalesInvoice');
        if (count > 0) {
          toUpdate.billCreated = 1;
        }
      }

      if (!frappe.GetStarted.supplierCreated) {
        const count = frappe.db.count('Party', {
          filters: { role: 'Supplier' },
        });
        if (count > 0) {
          toUpdate.supplierCreated = 1;
        }
      }
      await this.updateChecks(toUpdate);
    },
    async updateChecks(toUpdate) {
      await frappe.GetStarted.setMultiple(toUpdate);
      await frappe.GetStarted.update();
      frappe.GetStarted = await frappe.getSingle('GetStarted');
    },
    isCompleted(item) {
      return frappe.GetStarted.get(item.fieldname) || 0;
    },
    getIconComponent(item) {
      let completed = frappe.GetStarted[item.fieldname] || 0;
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
