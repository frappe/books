<!--
  Web-only org creation page. Creating the org here is what triggers Clerk's
  organization.created webhook (worker/routes/webhooks/organization-created.ts),
  which provisions the tenant Neon project. That provisioning is async, so
  this always routes to /dashboard next — Dashboard.vue itself polls until
  the tenant project is READY (AC-5), it doesn't assume it's ready already.
  Spec: docs/specs/0001-web-platform-foundation-control-plane.md
-->
<script setup lang="ts">
import { onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth, CreateOrganization } from '@clerk/vue';

const router = useRouter();
const { isLoaded, isSignedIn } = useAuth();

onMounted(() => {
  watch(
    isLoaded,
    (loaded) => {
      if (loaded && !isSignedIn.value) {
        void router.replace('/sign-in');
      }
    },
    { immediate: true }
  );
});
</script>

<template>
  <div class="flex items-center justify-center h-screen">
    <CreateOrganization :after-create-organization-url="'/dashboard'" />
  </div>
</template>
