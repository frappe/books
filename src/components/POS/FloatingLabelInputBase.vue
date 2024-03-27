<template>
  <div class="relative">
    <input
      :type="inputType"
      :class="[inputClasses, size === 'large' ? 'text-lg' : 'text-sm']"
      :value="value"
      :max="isNumeric(df) ? df.maxvalue : undefined"
      :min="isNumeric(df) ? df.minvalue : undefined"
      :readonly="isReadOnly"
      :tabindex="isReadOnly ? '-1' : '0'"
      @blur="onBlur"
      class="
        block
        px-2.5
        pb-2.5
        pt-4
        w-full
        font-medium
        text-gray-900
        dark:text-gray-100
        bg-gray-25
        dark:bg-gray-850
        rounded-lg
        border border-gray-200
        dark:border-gray-800
        appearance-none
        focus:outline-none focus:ring-0
        peer
      "
    />
    <label
      for="floating_outlined"
      :class="size === 'large' ? 'text-xl' : 'text-md'"
      class="
        absolute
        font-medium
        text-gray-500
        duration-300
        transform
        -translate-y-4
        scale-75
        top-1
        z-10
        origin-[0]
        bg-white2
        px-2
        peer-focus:px-2 peer-focus:text-blue-600 peer-focus:dark:text-blue-500
        peer-placeholder-shown:scale-100
        peer-placeholder-shown:-translate-y-1/2
        peer-placeholder-shown:top-1/2
        peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4
        left-1
      "
      >{{ df.label }}</label
    >
  </div>
</template>
<script lang="ts">
import { defineComponent } from 'vue';
import Base from '../Controls/Base.vue';

export default defineComponent({
  name: 'FloatingLabelInputBase',
  extends: Base,
});
</script>
