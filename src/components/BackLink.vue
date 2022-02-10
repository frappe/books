<template #title>
  <a
    class="cursor-pointer font-semibold flex items-center"
    @click="$router.back()"
  >
    <feather-icon name="chevron-left" class="w-5 h-5" />
    <span class="ml-1">{{ t('Back') }}</span>
  </a>
</template>
