<template>
    <span :class="['indicator', 'indicator-' + color]"></span>
</template>
<script>
import indicatorColor from 'frappejs/ui/constants/indicators';

export default {
    props: {
        color: {
            type: String,
            required: true,
            default: indicatorColor.GREY,
            validator(value) {
                const validColors = Object.values(indicatorColor);
                const valid = validColors.includes(value);
                if (!valid) {
                    console.warn(`color must be one of `, validColors);
                }
                return valid;
            }
        }
    }
}
</script>

<style lang="scss">
@import "../styles/variables";

.indicator {
    display: inline-block;
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 50%;
}

.indicator-grey {
    background-color: $gray-300;
}
.indicator-blue {
    background-color: $blue;
}
.indicator-red {
    background-color: $red;
}
.indicator-green {
    background-color: $green;
}
.indicator-orange {
    background-color: $orange;
}
.indicator-purple {
    background-color: $purple;
}
.indicator-yellow {
    background-color: $yellow;
}
.indicator-black {
    background-color: $gray-800;
}
</style>
