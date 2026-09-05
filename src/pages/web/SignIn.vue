<!--
  Web-only sign-in page (AC-1: a user can sign up and sign in via Clerk).
  Spec: docs/specs/0001-web-platform-foundation-control-plane.md
-->
<script setup lang="ts">
import { SignIn } from '@clerk/vue';
</script>

<template>
  <div class="flex items-center justify-center h-screen">
    <SignIn :fallback-redirect-url="'/dashboard'" :sign-up-url="'/sign-up'" />
  </div>
</template>
