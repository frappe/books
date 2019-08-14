<template>
  <div>
    <page-header title="Settings" />
    <div>
      <div class="col-9 col-lg-7 col-xl-6 mx-2 mt-4">
        <div>
          <setting-section doctype="AccountingSettings" />
          <hr class="mt-4" />
          <setting-section doctype="CompanySettings" />
          <hr class="mt-4" />
          <setting-section doctype="DashboardSettings" />
          <hr class="mt-4" />
          <setting-section doctype="EmailAccount" />
          <hr class="mt-4" />
          <setting-section doctype="SystemSettings" />
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import PageHeader from '@/components/PageHeader';
import SettingSection from './SettingSection';

export default {
  name: 'Settings',
  components: {
    PageHeader,
    SettingSection
  }
};
</script>
