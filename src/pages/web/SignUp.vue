<!--
  Web-only sign-up page (AC-1). After sign-up, routed to /create-organization
  rather than straight to /dashboard, since AC-5 requires an org (and its
  provisioned tenant project) before the dashboard is reachable.
  Spec: docs/specs/0001-web-platform-foundation-control-plane.md
-->
<script setup lang="ts">
import { SignUp } from '@clerk/vue';
</script>

<template>
  <div class="flex items-center justify-center h-screen">
    <SignUp
      :fallback-redirect-url="'/create-organization'"
      :sign-in-url="'/sign-in'"
    />
  </div>
</template>
