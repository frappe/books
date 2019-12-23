<template>
  <div class="flex flex-col overflow-y-hidden">
    <PageHeader>
      <h1 slot="title" class="text-2xl font-bold">
        {{ _('Setup your workspace') }}
      </h1>
    </PageHeader>
    <div class="px-8">
      <div class="mt-4 border-t"></div>
    </div>
    <div class="px-8 flex-1 overflow-y-auto">
      <div class="my-6" v-for="section in sections" :key="section.label">
        <h2 class="font-medium">{{ section.label }}</h2>
        <div class="mt-4 flex -mx-2">
          <div
            class="w-1/3 px-2"
            v-for="item in section.items"
            :key="item.label"
          >
            <div
              class="flex flex-col justify-between border rounded-lg p-6 h-full hover:shadow-md cursor-pointer"
              @mouseenter="() => (item.showActions = true)"
              @mouseleave="() => (item.showActions = false)"
            >
              <div>
                <component
                  v-show="!item.showActions"
                  :is="getIconComponent(item.icon)"
                  class="mb-4"
                />
                <h3 class="font-medium">{{ item.label }}</h3>
                <p class="mt-2 text-sm text-gray-800">
                  {{ item.description }}
                </p>
              </div>
              <div class="mt-2 flex" v-show="item.showActions">
                <Button class="leading-tight" type="primary">
                  <span class="text-white text-base">
                    {{ _('Setup') }}
                  </span>
                </Button>
                <Button class="ml-4 leading-tight">
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
import PageHeader from '@/components/PageHeader';
import Icon from '@/components/Icon';
import Button from '@/components/Button';

export default {
  name: 'GetStarted',
  components: {
    PageHeader,
    Button
  },
  data() {
    return {
      sections: [
        {
          label: 'Organisation',

          items: [
            {
              label: 'General',
              icon: 'general',
              description:
                'Setup your company information, email, country and fiscal year',
              showActions: false
            },
            {
              label: 'System',
              icon: 'general',
              description:
                'Setup system defaults like date format and currency precision',
              showActions: false
            },
            {
              label: 'Invoice',
              icon: 'invoice',
              description:
                'Customize your invoices by adding a logo and company address',
              showActions: false
            }
          ]
        },
        {
          label: 'Accounts',

          items: [
            {
              label: 'Review Accounts',
              icon: 'review-ac',
              description:
                'Review your chart of accounts, add any account or tax heads as needed',
              showActions: false
            },
            {
              label: 'Opening Balances',
              icon: 'opening-ac',
              description:
                'Setup your opening balances before performing any accounting entries',
              showActions: false
            },
            {
              label: 'Add Taxes',
              icon: 'percentage',
              description:
                'Setup your tax templates for your sales or purchase transactions',
              showActions: false
            }
          ]
        },
        {
          label: 'Sales',

          items: [
            {
              label: 'Add Items',
              icon: 'item',
              description:
                'Add products or services that you sell to your customers',
              showActions: false
            },
            {
              label: 'Add Customers',
              icon: 'customer',
              description: 'Add a few customers to create your first invoice',
              showActions: false
            },
            {
              label: 'Create Invoice',
              icon: 'sales-invoice',
              description:
                'Create your first invoice and mail it to your customer',
              showActions: false
            }
          ]
        },
        {
          label: 'Purchase',

          items: [
            {
              label: 'Add Items',
              icon: 'item',
              description:
                'Add products or services that you buy from your suppliers',
              showActions: false
            },
            {
              label: 'Add Suppliers',
              icon: 'supplier',
              description: 'Add a few suppliers to create your first bill',
              showActions: false
            },
            {
              label: 'Create Bill',
              icon: 'purchase-invoice',
              description:
                'Create your first bill and mail it to your supplier',
              showActions: false
            }
          ]
        }
      ]
    };
  },
  methods: {
    getIconComponent(name) {
      return {
        name,
        render(h) {
          return h(Icon, {
            props: Object.assign(
              {
                name,
                size: '18'
              },
              this.$attrs
            )
          });
        }
      };
    }
  }
};
</script>
