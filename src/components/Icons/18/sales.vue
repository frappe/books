<template>
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 14">
    <g fill="none" fill-rule="evenodd">
      <path
        :fill="darkColor"
        d="M0,5.11230469 L16,5.11230469 L16,12 C16,13.1045695 15.1045695,14 14,14 L2,14 C0.8954305,14 1.3527075e-16,13.1045695 0,12 L0,5.11230469 Z M8.5,10 C8.22385763,10 8,10.2238576 8,10.5 C8,10.7761424 8.22385763,11 8.5,11 L12.5,11 C12.7761424,11 13,10.7761424 13,10.5 C13,10.2238576 12.7761424,10 12.5,10 L8.5,10 Z"
      />
      <path
        :fill="lightColor"
        d="M2,0 L14,0 C15.1045695,-2.02906125e-16 16,0.8954305 16,2 L16,3.64526367 L0,3.64526367 L0,2 C-1.3527075e-16,0.8954305 0.8954305,2.02906125e-16 2,0 Z"
      />
    </g>
  </svg>
</template>
<script>
import Base from '../base.vue';
export default {
  name: 'IconSales',
  extends: Base,
};
</script>
