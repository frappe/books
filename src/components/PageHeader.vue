<template>
  <div class="my-4 mx-4 flex justify-between window-drag">
    <div class="window-no-drag">
      <slot name="title" />
    </div>
    <div class="flex items-stretch window-no-drag">
      <slot name="actions" />
    </div>
  </div>
</template>
