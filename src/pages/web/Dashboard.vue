<!--
  This feature's finish line (AC-5): signed in + org created + tenant
  project READY = an empty dashboard reachable. No accounting data here —
  that starts with feature 0002 (tenant schema & data layer).

  Deliberately a direct fetch() to /api/dashboard, NOT
  fyo.db.connectToDatabase(): DatabaseHandler.connectToDatabase()
  (fyo/core/dbHandler.ts) unconditionally calls init() -> getSchemaMap()
  right after, and getSchemaMap()'s web branch is NotImplemented until
  feature 0002 applies a tenant schema. See fyo/demux/db.ts's
  connectToDatabase for the same note from the other side.

  Spec: docs/specs/0001-web-platform-foundation-control-plane.md
-->
<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '@clerk/vue';

const router = useRouter();
const { isLoaded, isSignedIn, orgId } = useAuth();

type Status = 'CHECKING' | 'PROVISIONING' | 'READY' | 'FAILED';

const status = ref<Status>('CHECKING');
const errorMessage = ref('');
let pollHandle: ReturnType<typeof setTimeout> | undefined;

async function checkStatus() {
  try {
    const res = await fetch('/api/dashboard', { credentials: 'include' });
    const body = (await res.json().catch(() => ({}))) as { status?: string };

    if (!res.ok && res.status !== 202) {
      status.value = 'FAILED';
      errorMessage.value = body.status ?? res.statusText;
      return; // don't keep polling on a hard failure
    }

    status.value = (body.status as Status) ?? 'UNKNOWN';
  } catch (err) {
    status.value = 'FAILED';
    errorMessage.value = err instanceof Error ? err.message : String(err);
    return;
  }

  if (status.value === 'PROVISIONING' || status.value === 'CHECKING') {
    pollHandle = setTimeout(checkStatus, 2000);
  }
}

onMounted(() => {
  // useAuth() is reactive but not synchronously ready on first render —
  // wait for isLoaded before deciding whether to redirect (AC-1, AC-5).
  watch(
    isLoaded,
    (loaded) => {
      if (!loaded) return;
      if (!isSignedIn.value) {
        void router.replace('/sign-in');
        return;
      }
      if (!orgId.value) {
        void router.replace('/create-organization');
        return;
      }
      void checkStatus();
    },
    { immediate: true }
  );
});
onUnmounted(() => {
  if (pollHandle) clearTimeout(pollHandle);
});
</script>

<template>
  <div class="flex items-center justify-center h-screen">
    <div v-if="status === 'CHECKING' || status === 'PROVISIONING'">
      Setting up your account…
    </div>
    <div v-else-if="status === 'FAILED'">
      Something went wrong setting up your account. {{ errorMessage }}
    </div>
    <div v-else-if="status === 'READY'">
      <!-- Empty shell — feature 0002 fills this in with real accounting data. -->
      <h1>Welcome to RareBooks</h1>
    </div>
  </div>
</template>
