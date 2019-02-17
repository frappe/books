<template>
  <div>
    <page-header title="Settings" />
    <div class="row">
      <div class="col-8 bg-white mt-4 mx-auto border p-5">
        <setting-section doctype="AccountingSettings" />
        <hr class="mt-4">
        <setting-section doctype="SystemSettings" />
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
}
</script>
