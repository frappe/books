<template>
  <div>
    <page-header title="Settings" />
    <div class="row">
      <div class="col-12 bg-white border p-5">
        <div class="col-9 col-lg-6 ml-1">
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
