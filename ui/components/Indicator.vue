<template>
    <span :class="['indicator', 'indicator-' + color]"></span>
</template>
<script>
export default {
    props: ['color']
}
</script>

<style lang="scss">
@import "../styles/variables";

.indicator {
    display: inline-block;
    width: 0.5rem;
    height: 0.5rem;
    background-color: $gray-400;
    border-radius: 50%;
}

.indicator-blue {
    background-color: $primary;
}
</style>
