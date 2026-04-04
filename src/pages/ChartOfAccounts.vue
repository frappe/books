<template>
  <div class="flex flex-col h-full">
    <PageHeader :title="t`Chart of Accounts`">
      <Button v-if="!isAllExpanded" @click="expand">{{ t`Expand` }}</Button>
      <Button v-if="!isAllCollapsed" @click="collapse">{{
        t`Collapse`
      }}</Button>
    </PageHeader>

    <!-- Chart of Accounts -->
    <div
      v-if="root"
      class="
        flex-1 flex flex-col
        overflow-y-auto
        mb-4
        custom-scroll custom-scroll-thumb1
      "
    >
      <!-- Chart of Accounts Indented List -->
      <template v-for="account in allAccounts" :key="account.name">
        <!-- Account List Item -->
        <div
          class="
            py-2
            cursor-pointer
            hover:bg-gray-50
            dark:hover:bg-gray-890 dark:text-gray-25
            group
            flex
            items-center
            border-b
            dark:border-gray-800
            flex-shrink-0
            pe-4
          "
          :class="[
            account.level !== 0 ? 'text-base' : 'text-lg',
            isQuickEditOpen(account) ? 'bg-gray-200 dark:bg-gray-900' : '',
          ]"
          :style="getItemStyle(account.level)"
          @click="onClick(account)"
        >
          <component :is="getIconComponent(!!account.isGroup, account.name)" />
          <div class="flex items-baseline">
            <div
              class="ms-4"
              :class="[!account.parentAccount && 'font-semibold']"
            >
              {{ account.name }}
            </div>

            <!-- Add Account Buttons on Group Hover -->
            <div class="ms-6 hidden group-hover:block">
              <button
                v-if="account.isGroup"
                class="
                  text-xs text-gray-800
                  dark:text-gray-400
                  hover:text-gray-900
                  dark:hover:text-gray-100
                  focus:outline-none
                "
                @click.stop="addAccount(account, 'addingAccount')"
              >
                {{ t`Add Account` }}
              </button>
              <button
                v-if="account.isGroup"
                class="
                  ms-3
                  text-xs text-gray-800
                  dark:text-gray-400
                  hover:text-gray-900
                  dark:hover:text-gray-100
                  focus:outline-none
                "
                @click.stop="addAccount(account, 'addingGroupAccount')"
              >
                {{ t`Add Group` }}
              </button>
              <button
                class="
                  ms-3
                  text-xs text-gray-800
                  dark:text-gray-400
                  hover:text-gray-900
                  dark:hover:text-gray-100
                  focus:outline-none
                "
                @click.stop="deleteAccount(account)"
              >
                {{ account.isGroup ? t`Delete Group` : t`Delete Account` }}
              </button>
            </div>
          </div>

          <!-- Account Balance String -->
          <p
            v-if="!account.isGroup"
            class="ms-auto text-base text-gray-800 dark:text-gray-400"
          >
            {{ getBalanceString(account) }}
          </p>
        </div>

        <!-- Add Account/Group -->
        <div
          v-if="account.addingAccount || account.addingGroupAccount"
          :key="account.name + '-adding-account'"
          class="
            px-4
            border-b
            dark:border-gray-800
            cursor-pointer
            hover:bg-gray-50
            dark:hover:bg-gray-890
            group
            flex
            items-center
            text-base
          "
          :style="getGroupStyle(account.level + 1)"
        >
          <component :is="getIconComponent(account.addingGroupAccount)" />
          <div class="flex ms-4 h-row-mid items-center">
            <input
              :ref="account.name"
              v-model="newAccountName"
              class="
                focus:outline-none
                bg-transparent
                dark:placeholder-gray-600 dark:text-gray-400
              "
              :class="{ 'text-gray-600 dark:text-gray-400': insertingAccount }"
              :placeholder="t`New Account`"
              type="text"
              :disabled="insertingAccount"
              @keydown.esc="cancelAddingAccount(account)"
              @keydown.enter="
                (e) => createNewAccount(account, account.addingGroupAccount)
              "
            />
            <button
              v-if="!insertingAccount"
              class="
                ms-4
                text-xs text-gray-800
                dark:text-gray-400
                hover:text-gray-900
                dark:hover:text-gray-100
                focus:outline-none
              "
              @click="
                (e) => createNewAccount(account, account.addingGroupAccount)
              "
            >
              {{ t`Save` }}
            </button>
            <button
              v-if="!insertingAccount"
              class="
                ms-4
                text-xs text-gray-800
                dark:text-gray-400
                hover:text-gray-900
                dark:hover:text-gray-100
                focus:outline-none
              "
              @click="cancelAddingAccount(account)"
            >
              {{ t`Cancel` }}
            </button>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
<script lang="ts">
import { t } from 'fyo';
import { isCredit } from 'models/helpers';
import { ModelNameEnum } from 'models/types';
import PageHeader from 'src/components/PageHeader.vue';
import { fyo } from 'src/initFyo';
import { languageDirectionKey } from 'src/utils/injectionKeys';
import { docsPathMap } from 'src/utils/misc';
import { docsPathRef } from 'src/utils/refs';
import { commongDocDelete, openQuickEdit } from 'src/utils/ui';
import { getMapFromList, removeAtIndex } from 'utils/index';
import { defineComponent, nextTick } from 'vue';
import Button from '../components/Button.vue';
import { inject } from 'vue';
import { handleErrorWithDialog } from '../errorHandling';
import { AccountRootType, AccountType } from 'models/baseModels/Account/types';
import { TreeViewSettings } from 'fyo/model/types';
import { Doc } from 'fyo/model/doc';
import { Component } from 'vue';
import { uicolors } from 'src/utils/colors';
import { showDialog } from 'src/utils/interactive';

type AccountItem = {
  name: string;
  parentAccount: string;
  rootType: AccountRootType;
  accountType: AccountType;
  level: number;
  location: number[];
  isGroup?: boolean;
  children: AccountItem[];
  expanded: boolean;
  addingAccount: boolean;
  addingGroupAccount: boolean;
};

type AccKey = 'addingAccount' | 'addingGroupAccount';

export default defineComponent({
  components: {
    Button,
    PageHeader,
  },
  props: {
    darkMode: { type: Boolean, default: false },
  },
  setup() {
    return {
      languageDirection: inject(languageDirectionKey),
    };
  },
  data() {
    return {
      isAllCollapsed: true,
      isAllExpanded: false,
      root: null as null | { label: string; balance: number; currency: string },
      accounts: [] as AccountItem[],
      schemaName: 'Account',
      newAccountName: '',
      insertingAccount: false,
      totals: {} as Record<string, { totalDebit: number; totalCredit: number }>,
      refetchTotals: false,
      settings: null as null | TreeViewSettings,
    };
  },
  computed: {
    allAccounts() {
      const allAccounts: AccountItem[] = [];

      (function getAccounts(
        accounts: AccountItem[],
        level: number,
        location: number[]
      ) {
        for (let i = 0; i < accounts.length; i++) {
          const account = accounts[i];

          account.level = level;
          account.location = [...location, i];
          allAccounts.push(account);

          if (account.children != null && account.expanded) {
            getAccounts(account.children, level + 1, account.location);
          }
        }
      })(this.accounts, 0, []);

      return allAccounts;
    },
  },
  async mounted() {
    await this.setTotalDebitAndCredit();
    fyo.doc.observer.on('sync:AccountingLedgerEntry', () => {
      this.refetchTotals = true;
    });
  },
  async activated() {
    await this.fetchAccounts();
    if (fyo.store.isDevelopment) {
      // @ts-ignore
      window.coa = this;
    }

    docsPathRef.value = docsPathMap.ChartOfAccounts!;

    if (this.refetchTotals) {
      await this.setTotalDebitAndCredit();
      this.refetchTotals = false;
    }
  },
  deactivated() {
    docsPathRef.value = '';
  },
  methods: {
    async expand() {
      await this.toggleAll(this.accounts, true);
      this.isAllCollapsed = false;
      this.isAllExpanded = true;
    },
    async collapse() {
      await this.toggleAll(this.accounts, false);
      this.isAllExpanded = false;
      this.isAllCollapsed = true;
    },
    async toggleAll(accounts: AccountItem | AccountItem[], expand: boolean) {
      if (!Array.isArray(accounts)) {
        await this.toggle(accounts, expand);
        accounts = accounts.children ?? [];
      }

      for (const account of accounts) {
        await this.toggleAll(account, expand);
      }
    },
    async toggle(account: AccountItem, expand: boolean) {
      if (account.expanded === expand || !account.isGroup) {
        return;
      }

      await this.toggleChildren(account);
    },
    getBalance(account: AccountItem) {
      const total = this.totals[account.name];
      if (!total) {
        return 0;
      }

      const { totalCredit, totalDebit } = total;

      if (isCredit(account.rootType)) {
        return totalCredit - totalDebit;
      }

      return totalDebit - totalCredit;
    },
    getBalanceString(account: AccountItem) {
      const suffix = isCredit(account.rootType) ? t`Cr.` : t`Dr.`;
      const balance = this.getBalance(account);
      return `${fyo.format(balance, 'Currency')} ${suffix}`;
    },
    async setTotalDebitAndCredit() {
      const totals = await this.fyo.db.getTotalCreditAndDebit();
      this.totals = getMapFromList(totals, 'account');
    },
    async fetchAccounts() {
      this.settings =
        fyo.models[ModelNameEnum.Account]?.getTreeSettings(fyo) ?? null;
      const currency = this.fyo.singles.SystemSettings?.currency ?? '';
      const label = (await this.settings?.getRootLabel()) ?? '';

      this.root = {
        label,
        balance: 0,
        currency,
      };
      this.accounts = await this.getChildren();
    },
    async onClick(account: AccountItem) {
      let shouldOpen = !account.isGroup;
      if (account.isGroup) {
        shouldOpen = !(await this.toggleChildren(account));
      }

      if (account.isGroup && account.expanded) {
        this.isAllCollapsed = false;
      }

      if (account.isGroup && !account.expanded) {
        this.isAllExpanded = false;
      }

      if (!shouldOpen) {
        return;
      }

      const doc = await fyo.doc.getDoc(ModelNameEnum.Account, account.name);
      this.setOpenAccountDocListener(doc, account);
      await openQuickEdit({ doc });
    },
    setOpenAccountDocListener(
      doc: Doc,
      account?: AccountItem,
      parentAccount?: AccountItem
    ) {
      if (doc.hasListener('afterDelete')) {
        return;
      }

      doc.once('afterDelete', () => {
        this.removeAccount(doc.name!, account, parentAccount);
      });
    },
    async deleteAccount(account: AccountItem) {
      const canDelete = await this.canDeleteAccount(account);
      if (!canDelete) {
        return;
      }

      const doc = await fyo.doc.getDoc(ModelNameEnum.Account, account.name);
      this.setOpenAccountDocListener(doc, account);

      await commongDocDelete(doc, false);
    },
    async canDeleteAccount(account: AccountItem) {
      if (account.isGroup && !account.children?.length) {
        await this.fetchChildren(account);
      }

      if (!account.children?.length) {
        return true;
      }

      await showDialog({
        type: 'error',
        title: t`Cannot Delete Account`,
        detail: t`${account.name} has linked child accounts.`,
      });

      return false;
    },
    removeAccount(
      name: string,
      account?: AccountItem,
      parentAccount?: AccountItem
    ) {
      if (account == null && parentAccount == null) {
        return;
      }

      if (account == null && parentAccount) {
        account = parentAccount.children.find((ch) => ch?.name === name);
      }

      if (account == null) {
        return;
      }

      const indices = account.location.slice(1).map((i) => Number(i));

      let i = Number(account.location[0]);
      let parent = this.accounts[i];
      let children = this.accounts[i].children;

      while (indices.length > 1) {
        i = indices.shift()!;

        parent = children[i];
        children = children[i].children;
      }

      i = indices[0];

      if (children[i].name !== name) {
        return;
      }

      parent.children = removeAtIndex(children, i);
    },
    async toggleChildren(account: AccountItem) {
      const hasChildren = await this.fetchChildren(account);
      if (!hasChildren) {
        return false;
      }

      account.expanded = !account.expanded;
      if (!account.expanded) {
        account.addingAccount = false;
        account.addingGroupAccount = false;
      }

      return true;
    },
    async fetchChildren(account: AccountItem, force = false) {
      if (account.children == null || force) {
        account.children = await this.getChildren(account.name);
      }

      return !!account?.children?.length;
    },
    async getChildren(parent: null | string = null): Promise<AccountItem[]> {
      const children = await fyo.db.getAll(ModelNameEnum.Account, {
        filters: {
          parentAccount: parent,
        },
        fields: ['name', 'parentAccount', 'isGroup', 'rootType', 'accountType'],
        orderBy: 'name',
        order: 'asc',
      });

      return children.map((d) => {
        d.expanded = false;
        d.addingAccount = false;
        d.addingGroupAccount = false;

        return d as unknown as AccountItem;
      });
    },
    async addAccount(parentAccount: AccountItem, key: AccKey) {
      if (!parentAccount.expanded) {
        await this.fetchChildren(parentAccount);
        parentAccount.expanded = true;
      }
      // activate editing of type 'key' and deactivate other type
      let otherKey: AccKey =
        key === 'addingAccount' ? 'addingGroupAccount' : 'addingAccount';
      parentAccount[key] = true;
      parentAccount[otherKey] = false;

      await nextTick();
      let input = (this.$refs[parentAccount.name] as HTMLInputElement[])[0];
      input.focus();
    },
    cancelAddingAccount(parentAccount: AccountItem) {
      parentAccount.addingAccount = false;
      parentAccount.addingGroupAccount = false;
      this.newAccountName = '';
    },
    async createNewAccount(parentAccount: AccountItem, isGroup: boolean) {
      // freeze input
      this.insertingAccount = true;

      const accountName = this.newAccountName.trim();
      const doc = fyo.doc.getNewDoc('Account');
      try {
        let { name, rootType, accountType } = parentAccount;
        await doc.set({
          name: accountName,
          parentAccount: name,
          rootType,
          accountType,
          isGroup,
        });
        await doc.sync();

        // turn off editing
        parentAccount.addingAccount = false;
        parentAccount.addingGroupAccount = false;

        // update accounts
        await this.fetchChildren(parentAccount, true);

        // open quick edit
        await openQuickEdit({ doc });
        this.setOpenAccountDocListener(doc, undefined, parentAccount);

        // unfreeze input
        this.insertingAccount = false;
        this.newAccountName = '';
      } catch (e) {
        // unfreeze input
        this.insertingAccount = false;
        await handleErrorWithDialog(e, doc);
      }
    },
    isQuickEditOpen(account: AccountItem) {
      let { edit, schemaName, name } = this.$route.query;
      return !!(edit && schemaName === 'Account' && name === account.name);
    },
    getIconComponent(isGroup: boolean, name?: string): Component {
      let lightColor = this.darkMode ? uicolors.gray[600] : uicolors.gray[400];
      let darkColor = this.darkMode ? uicolors.gray[400] : uicolors.gray[700];
      let icons = {
        'Application of Funds (Assets)': `<svg class="w-4 h-4" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
            <g fill="none" fill-rule="evenodd">
              <path d="M15.333 5.333H.667A.667.667 0 000 6v9.333c0 .368.299.667.667.667h14.666a.667.667 0 00.667-.667V6a.667.667 0 00-.667-.667zM8 12.667a2 2 0 110-4 2 2 0 010 4z" fill="${darkColor}" fill-rule="nonzero"/>
              <path d="M14 2.667V4H2V2.667h12zM11.333 0v1.333H4.667V0h6.666z" fill="${lightColor}"/>
            </g>
          </svg>`,
        Expenses: `<svg class="w-4 h-4" viewBox="0 0 14 16" xmlns="http://www.w3.org/2000/svg">
            <path d="M13.668 0v15.333a.666.666 0 01-.666.667h-12a.666.666 0 01-.667-.667V0l2.667 2 2-2 2 2 2-2 2 2 2.666-2zM9.964 4.273H4.386l-.311 1.133h1.62c.933 0 1.474.362 1.67.963H4.373l-.298 1.053h3.324c-.175.673-.767 1.044-1.705 1.044H4.182l.008.83L7.241 13h1.556v-.072L6.01 9.514c1.751-.106 2.574-.942 2.748-2.092h.904l.298-1.053H8.75a2.375 2.375 0 00-.43-1.044l1.342.009.302-1.061z" fill="${darkColor}" fill-rule="evenodd"/>
          </svg>`,
        Income: `<svg class="w-4 h-4" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
            <g fill="none" fill-rule="evenodd">
              <path d="M16 12.859V14c0 1.105-2.09 2-4.667 2-2.494 0-4.531-.839-4.66-1.894L6.667 14v-1.141C7.73 13.574 9.366 14 11.333 14c1.968 0 3.602-.426 4.667-1.141zm0-3.334v1.142c0 1.104-2.09 2-4.667 2-2.494 0-4.531-.839-4.66-1.894l-.006-.106V9.525c1.064.716 2.699 1.142 4.666 1.142 1.968 0 3.602-.426 4.667-1.142zm-4.667-4.192c2.578 0 4.667.896 4.667 2 0 1.105-2.09 2-4.667 2s-4.666-.895-4.666-2c0-1.104 2.089-2 4.666-2z" fill="${darkColor}"/>
              <path d="M0 10.859C1.065 11.574 2.7 12 4.667 12l.337-.005.33-.013v1.995c-.219.014-.44.023-.667.023-2.495 0-4.532-.839-4.66-1.894L0 12v-1.141zm0-2.192V7.525c1.065.716 2.7 1.142 4.667 1.142l.337-.005.33-.013v1.995c-.219.013-.44.023-.667.023-2.495 0-4.532-.839-4.66-1.894L0 8.667V7.525zm0-4.475c1.065.715 2.7 1.141 4.667 1.141.694 0 1.345-.056 1.946-.156-.806.56-1.27 1.292-1.278 2.134-.219.013-.441.022-.668.022-2.578 0-4.667-.895-4.667-2zM4.667 0c2.577 0 4.666.895 4.666 2S7.244 4 4.667 4C2.089 4 0 3.105 0 2s2.09-2 4.667-2z" fill="${lightColor}"/>
            </g>
          </svg>`,
        'Source of Funds (Liabilities)': `<svg class="w-4 h-4" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
            <g fill="none" fill-rule="evenodd">
              <path d="M7.332 11.36l4.666-3.734 2 1.6V.666A.667.667 0 0013.332 0h-12a.667.667 0 00-.667.667v14.666c0 .369.298.667.667.667h6v-4.64zm-4-7.36H11.3v1.333H3.332V4zm2.666 8H3.332v-1.333h2.666V12zM3.332 8.667V7.333h5.333v1.334H3.332z" fill="${darkColor}"/>
              <path d="M15.332 12l-3.334-2.667L8.665 12v3.333c0 .369.298.667.667.667h2v-2h1.333v2h2a.667.667 0 00.667-.667V12z" fill="${lightColor}"/>
            </g>
          </svg>`,
      };

      let leaf = `<svg class="w-2 h-2" viewBox="0 0 8 8" xmlns="http://www.w3.org/2000/svg">
        <circle stroke="${darkColor}" cx="4" cy="4" r="3.5" fill="none" fill-rule="evenodd"/>
      </svg>`;

      let folder = `<svg class="w-3 h-3" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
        <path d="M8.333 3.367L6.333.7H.667A.667.667 0 000 1.367v12a2 2 0 002 2h12a2 2 0 002-2V4.033a.667.667 0 00-.667-.666h-7z" fill="${darkColor}" fill-rule="evenodd"/>
      </svg>`;

      let icon = isGroup ? folder : leaf;

      return {
        template: icons[name as keyof typeof icons] || icon,
      };
    },
    getItemStyle(level: number) {
      const styles: Record<string, string> = {
        height: 'calc(var(--h-row-mid) + 1px)',
      };
      if (this.languageDirection === 'rtl') {
        styles['padding-right'] = `calc(1rem + 2rem * ${level})`;
      } else {
        styles['padding-left'] = `calc(1rem + 2rem * ${level})`;
      }
      return styles;
    },
    getGroupStyle(level: number) {
      const styles: Record<string, string> = {
        height: 'height: calc(var(--h-row-mid) + 1px)',
      };
      if (this.languageDirection === 'rtl') {
        styles['padding-right'] = `calc(1rem + 2rem * ${level})`;
      } else {
        styles['padding-left'] = `calc(1rem + 2rem * ${level})`;
      }
      return styles;
    },
  },
});
</script>
