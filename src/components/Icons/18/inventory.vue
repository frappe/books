<template>
  <svg
    width="20"
    height="20"
    viewBox="0 0 18 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M7.4943 0.151836C7.88385 -0.0506121 8.33973 -0.0506121 8.72928 0.151836L17.0957 4.49986L14.7724 5.70728L5.78847 1.03835L7.4943 0.151836Z"
      :fill="lightColor"
    />
    <path
      d="M9.88794 8.24572L0.904053 3.57679L4.11554 1.90778L13.0994 6.57671L9.88794 8.24572Z"
      :fill="lightColor"
    />
    <path
      d="M10.6569 9.58498L17.9952 5.77127C17.9984 5.81193 18 5.85301 18 5.89441V12.453C18 12.9868 17.7304 13.4692 17.3093 13.7319L10.6569 17.8806L10.6569 9.58498Z"
      :fill="darkColor"
    />
    <path
      d="M9.11923 9.58498L9.11923 18L0.78452 13.6684C0.313082 13.4234 0 12.9121 0 12.336V4.97134C0 4.92994 0.00161725 4.88887 0.00479439 4.84821L9.11923 9.58498Z"
      :fill="darkColor"
    />
  </svg>
</template>
<script>
import Base from '../base';
export default {
  name: 'IconInventory',
  extends: Base,
};
</script>
