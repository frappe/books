<template>
  <div>
    <PageHeader :title="t`Template Builder`" />
  </div>
</template>
<script lang="ts">
import PageHeader from 'src/components/PageHeader.vue';
import { defineComponent } from 'vue';

export default defineComponent({ components: { PageHeader } });
</script>
