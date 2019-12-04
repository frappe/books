<template>
  <a
    class="cursor-pointer font-semibold flex items-center"
    slot="title"
    @click="$emit('click')"
  >
    <feather-icon name="chevron-left" class="w-5 h-5" />
    <span class="ml-1">{{ _('Back') }}</span>
  </a>
</template>
