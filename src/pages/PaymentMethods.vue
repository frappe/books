<template>
  <div class="flex flex-col h-full overflow-hidden bg-white dark:bg-gray-890">
    <PageHeader :title="t`Payment Methods`">
      <Button type="primary" @click="addPaymentMethod">
        <feather-icon name="plus" class="w-4 h-4" />
        <span class="ms-2 hidden sm:inline">{{ t`Add Payment Method` }}</span>
      </Button>
    </PageHeader>

    <div class="flex-1 overflow-auto custom-scroll custom-scroll-thumb1">
      <div class="p-4">
        <!-- Info Card -->
        <div class="mb-6 p-4 bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20 rounded-lg">
          <p class="text-sm text-blue-600 dark:text-blue-400">
            {{ t`Select accounts from Current Assets to use as payment methods. These accounts will be displayed in the Account Balances table on the dashboard.` }}
          </p>
        </div>

        <!-- Payment Methods Table -->
        <div
          v-if="paymentMethods.length > 0"
          class="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden"
        >
          <table class="w-full">
            <thead class="bg-gray-50 dark:bg-gray-850">
              <tr>
                <th
                  class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider"
                >
                  {{ t`Name` }}
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider"
                >
                  {{ t`Type` }}
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider"
                >
                  {{ t`Account` }}
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider"
                >
                  {{ t`Balance` }}
                </th>
                <th class="px-4 py-3 w-24"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-800">
              <tr
                v-for="method in paymentMethods"
                :key="method.name"
                class="hover:bg-gray-50 dark:hover:bg-gray-850"
              >
                <td class="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                  {{ method.name }}
                </td>
                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                  {{ method.type }}
                </td>
                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                  {{ method.account }}
                </td>
                <td class="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                  {{ formatCurrency(method.balance || 0) }}
                </td>
                <td class="px-4 py-3 text-right">
                  <Button
                    type="secondary"
                    size="small"
                    @click="editPaymentMethod(method)"
                  >
                    {{ t`Edit` }}
                  </Button>
                  <Button
                    type="secondary"
                    size="small"
                    class="ml-2"
                    @click="deletePaymentMethod(method)"
                  >
                    {{ t`Delete` }}
                  </Button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Empty State -->
        <div
          v-else
          class="border border-gray-200 dark:border-gray-800 rounded-lg p-12 text-center"
        >
          <feather-icon
            name="credit-card"
            class="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4"
          />
          <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            {{ t`No Payment Methods` }}
          </h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {{ t`Add payment methods to track account balances on your dashboard.` }}
          </p>
          <Button type="primary" @click="addPaymentMethod">
            {{ t`Add Your First Payment Method` }}
          </Button>
        </div>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <Modal :open-modal="showModal" @closemodal="closeModal">
      <div class="p-6 w-form">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
          {{ editingMethod ? t`Edit Payment Method` : t`Add Payment Method` }}
        </h2>

        <div v-if="doc" class="space-y-4">
          <!-- Name -->
          <FormControl
            :df="nameField"
            :value="doc.name"
            :read-only="!!editingMethod"
            @change="(value) => doc.set('name', value)"
          />

          <!-- Type -->
          <FormControl
            :df="typeField"
            :value="doc.type"
            @change="(value) => doc.set('type', value)"
          />

          <!-- Account -->
          <FormControl
            :df="accountField"
            :value="doc.account"
            @change="(value) => doc.set('account', value)"
          />
        </div>

        <!-- Actions -->
        <div class="flex justify-end gap-2 mt-6">
          <Button type="secondary" @click="closeModal">
            {{ t`Cancel` }}
          </Button>
          <Button
            type="primary"
            :disabled="!canSave"
            @click="savePaymentMethod"
          >
            {{ t`Save` }}
          </Button>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import Button from 'src/components/Button.vue';
import Modal from 'src/components/Modal.vue';
import PageHeader from 'src/components/PageHeader.vue';
import FormControl from 'src/components/Controls/FormControl.vue';
import { fyo } from 'src/initFyo';
import { showToast } from 'src/utils/interactive';
import { Field } from 'schemas/types';

export default defineComponent({
  name: 'PaymentMethods',
  components: {
    Button,
    Modal,
    PageHeader,
    FormControl,
  },
  data() {
    return {
      paymentMethods: [] as any[],
      currentAssetAccounts: [] as any[],
      showModal: false,
      editingMethod: null as any,
      doc: null as any,
    };
  },
  computed: {
    canSave(): boolean {
      return !!(this.doc?.name && this.doc?.type && this.doc?.account);
    },
    nameField(): Field {
      return {
        fieldname: 'name',
        label: this.t`Name`,
        fieldtype: 'Data',
        required: true,
        placeholder: this.t`e.g., Cash Account, Bank Account`,
      } as Field;
    },
    typeField(): Field {
      return {
        fieldname: 'type',
        label: this.t`Type`,
        fieldtype: 'Select',
        required: true,
        options: [
          { label: this.t`Cash`, value: 'Cash' },
          { label: this.t`Bank`, value: 'Bank' },
          { label: this.t`Transfer`, value: 'Transfer' },
        ],
      } as Field;
    },
    accountField(): Field {
      return {
        fieldname: 'account',
        label: this.t`Account (Current Assets)`,
        fieldtype: 'Link',
        target: 'Account',
        required: true,
        filters: {
          rootType: 'Asset',
          accountType: 'Current Asset',
          isGroup: false,
        },
      } as Field;
    },
  },
  async mounted() {
    await this.loadData();
  },
  methods: {
    async loadData() {
      try {
        // Load payment methods
        const methods = await fyo.db.getAll('PaymentMethod', {
          fields: ['name', 'type', 'account'],
        });

        // Load balances for each account
        this.paymentMethods = await Promise.all(
          methods.map(async (method: any) => {
            let balance = 0;
            if (method.account) {
              try {
                const ledgerEntries = await fyo.db.getAll('AccountingLedgerEntry', {
                  fields: ['debit', 'credit'],
                  filters: { account: method.account },
                });
                balance = ledgerEntries.reduce((sum: number, entry: any) => {
                  return sum + (entry.debit || 0) - (entry.credit || 0);
                }, 0);
              } catch (err) {
                console.error('Error loading balance:', err);
              }
            }
            return { ...method, balance };
          })
        );

        // Load current asset accounts - fetch all non-group accounts under Asset root
        const allAssetAccounts = await fyo.db.getAll('Account', {
          fields: ['name', 'rootType', 'accountType', 'isGroup'],
          filters: {
            rootType: 'Asset',
            isGroup: false,
          },
        });
        
        // Filter for Current Asset accounts
        this.currentAssetAccounts = allAssetAccounts.filter(
          (acc: any) => acc.accountType === 'Current Asset'
        );
        
        console.log('Loaded current asset accounts:', this.currentAssetAccounts);
      } catch (error) {
        console.error('Error loading data:', error);
        showToast({
          type: 'error',
          message: this.t`Failed to load payment methods`,
        });
      }
    },
    async addPaymentMethod() {
      this.editingMethod = null;
      this.doc = fyo.doc.getNewDoc('PaymentMethod');
      this.showModal = true;
    },
    async editPaymentMethod(method: any) {
      this.editingMethod = method;
      this.doc = await fyo.doc.getDoc('PaymentMethod', method.name);
      this.showModal = true;
    },
    async deletePaymentMethod(method: any) {
      try {
        const doc = await fyo.doc.getDoc('PaymentMethod', method.name);
        await doc.delete();
        await this.loadData();
        showToast({
          type: 'success',
          message: this.t`Payment method deleted successfully`,
        });
      } catch (error) {
        console.error('Error deleting payment method:', error);
        showToast({
          type: 'error',
          message: this.t`Failed to delete payment method`,
        });
      }
    },
    async savePaymentMethod() {
      try {
        await this.doc.sync();

        await this.loadData();
        this.closeModal();
        showToast({
          type: 'success',
          message: this.t`Payment method saved successfully`,
        });
      } catch (error) {
        console.error('Error saving payment method:', error);
        showToast({
          type: 'error',
          message: this.t`Failed to save payment method`,
        });
      }
    },
    closeModal() {
      this.showModal = false;
      this.editingMethod = null;
    },
    formatCurrency(value: number): string {
      return fyo.format(value, 'Currency');
    },
  },
});
</script>
