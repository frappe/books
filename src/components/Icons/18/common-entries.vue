<template>
  <svg
    width="18"
    height="18"
    viewBox="0 0 18 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M1.28577 0.728572C1.28577 0.326193 1.61196 0 2.01434 0H15.5572C15.9596 0 16.2858 0.326193 16.2858 0.728571V8.78571H12.1V12.5317H8.50592L12.9132 18H2.01434C1.61196 18 1.28577 17.6738 1.28577 17.2714V0.728572ZM13.5001 5.89286H4.71434V4.39286H13.5001V5.89286ZM4.71434 9.75H10.7143V8.25H4.71434V9.75ZM7.28577 13.6071H4.71434V12.1071H7.28577V13.6071Z"
      :fill="darkColor"
    />
    <path
      d="M16.2858 13.7317V15.6992L14.4429 17.9857L11.0143 13.7317H13.3V9.98571H15.5857V13.7317H16.2858Z"
      :fill="darkColor"
    />
    <path
      d="M13.3 13.7317V9.98572H14.4429H15.5857V13.7317H17.8714L14.4429 17.9857L11.0143 13.7317H13.3Z"
      :fill="lightColor"
    />
  </svg>
</template>
<script>
import Base from '../base.vue';
export default {
  name: 'IconPurchase',
  extends: Base,
};
</script>
