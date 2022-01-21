<template>
  <div class="flex flex-col overflow-y-hidden">
    <PageHeader>
      <h1 slot="title" class="text-2xl font-bold">
        {{ _('Setup your workspace') }}
      </h1>
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
                    {{ item.actionLabel || _('Setup') }}
                  </span>
                </Button>
                <Button
                  v-if="item.documentation"
                  class="leading-tight"
                  :class="{ 'ml-4': item.action }"
                  @click="handleDocumentation(item)"
                >
                  <span class="text-base">
                    {{ _('Documentation') }}
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
import frappe from 'frappe';
import { _ } from 'frappe/utils';
import PageHeader from '@/components/PageHeader';
import Icon from '@/components/Icon';
import Button from '@/components/Button';
import { openSettings } from '@/utils';
import { ipcRenderer } from 'electron';
import { IPC_MESSAGES } from '@/messages';
import { routeTo } from '@/utils';

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
          label: _('Organisation'),

          items: [
            {
              key: 'Invoice',
              label: _('Invoice'),
              icon: 'invoice',
              description:
                'Customize your invoices by adding a logo and address details',
              fieldname: 'invoiceSetup',
              action() {
                openSettings('Invoice');
              },
            },
            {
              key: 'General',
              label: _('General'),
              icon: 'general',
              description:
                'Setup your company information, email, country and fiscal year',
              fieldname: 'companySetup',
              action() {
                openSettings('General');
              },
            },
            {
              key: 'System',
              label: _('System'),
              icon: 'system',
              description:
                'Setup system defaults like date format and display precision',
              fieldname: 'systemSetup',
              action() {
                openSettings('System');
              },
            },
          ],
        },
        {
          label: _('Accounts'),

          items: [
            {
              key: 'Review Accounts',
              label: _('Review Accounts'),
              icon: 'review-ac',
              description:
                'Review your chart of accounts, add any account or tax heads as needed',
              action: () => {
                routeTo('/chart-of-accounts');
              },
              fieldname: 'chartOfAccountsReviewed',
              documentation:
                'https://frappebooks.com/docs/setting-up#1-enter-bank-accounts',
            },
            {
              key: 'Opening Balances',
              label: _('Opening Balances'),
              icon: 'opening-ac',
              fieldname: 'openingBalanceChecked',
              description:
                'Setup your opening balances before performing any accounting entries',
              documentation:
                'https://frappebooks.com/docs/setting-up#5-setup-opening-balances',
            },
            {
              key: 'Add Taxes',
              label: _('Add Taxes'),
              icon: 'percentage',
              fieldname: 'taxesAdded',
              description:
                'Setup your tax templates for your sales or purchase transactions',
              action: () => routeTo('/list/Tax'),
              documentation:
                'https://frappebooks.com/docs/setting-up#2-add-taxes',
            },
          ],
        },
        {
          label: _('Sales'),

          items: [
            {
              key: 'Add Sales Items',
              label: _('Add Items'),
              icon: 'item',
              description:
                'Add products or services that you sell to your customers',
              action: () => routeTo('/list/Item'),
              fieldname: 'itemCreated',
              documentation:
                'https://frappebooks.com/docs/setting-up#3-add-items',
            },
            {
              key: 'Add Customers',
              label: _('Add Customers'),
              icon: 'customer',
              description: 'Add a few customers to create your first invoice',
              action: () => routeTo('/list/Customer'),
              fieldname: 'customerCreated',
              documentation:
                'https://frappebooks.com/docs/setting-up#4-add-customers',
            },
            {
              key: 'Create Invoice',
              label: _('Create Invoice'),
              icon: 'sales-invoice',
              description:
                'Create your first invoice and mail it to your customer',
              action: () => routeTo('/list/SalesInvoice'),
              fieldname: 'invoiceCreated',
              documentation: 'https://frappebooks.com/docs/invoices',
            },
          ],
        },
        {
          label: _('Purchase'),

          items: [
            {
              key: 'Add Purchase Items',
              label: _('Add Items'),
              icon: 'item',
              description:
                'Add products or services that you buy from your suppliers',
              action: () => routeTo('/list/Item'),
              fieldname: 'itemCreated',
            },
            {
              key: 'Add Suppliers',
              label: _('Add Suppliers'),
              icon: 'supplier',
              description: 'Add a few suppliers to create your first bill',
              action: () => routeTo('/list/Supplier'),
              fieldname: 'supplierCreated',
            },
            {
              key: 'Create Bill',
              label: _('Create Bill'),
              icon: 'purchase-invoice',
              description:
                'Create your first bill and mail it to your supplier',
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
        await systemSettings.update({ hideGetStarted: 1 });
      }

      return onboardingComplete;
    },
    async checkForCompletedTasks() {
      let toUpdate = {};
      if (await this.checkIsOnboardingComplete()) {
        return;
      }

      if (!frappe.GetStarted.itemCreated) {
        let { count } = (
          await frappe.db.knex('Item').count('name as count')
        )[0];
        if (count > 0) {
          toUpdate.itemCreated = 1;
        }
      }

      if (!frappe.GetStarted.invoiceCreated) {
        let { count } = (
          await frappe.db.knex('SalesInvoice').count('name as count')
        )[0];
        if (count > 0) {
          toUpdate.invoiceCreated = 1;
        }
      }

      if (!frappe.GetStarted.customerCreated) {
        let { count } = (
          await frappe.db
            .knex('Party')
            .where('customer', 1)
            .count('name as count')
        )[0];
        if (count > 0) {
          toUpdate.customerCreated = 1;
        }
      }

      if (!frappe.GetStarted.billCreated) {
        let { count } = (
          await frappe.db.knex('PurchaseInvoice').count('name as count')
        )[0];
        if (count > 0) {
          toUpdate.billCreated = 1;
        }
      }

      if (!frappe.GetStarted.supplierCreated) {
        let { count } = (
          await frappe.db
            .knex('Party')
            .where('supplier', 1)
            .count('name as count')
        )[0];
        if (count > 0) {
          toUpdate.supplierCreated = 1;
        }
      }
      await this.updateChecks(toUpdate);
    },
    async updateChecks(toUpdate) {
      await frappe.GetStarted.update(toUpdate);
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
        render(h) {
          return h(Icon, {
            props: Object.assign(
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
