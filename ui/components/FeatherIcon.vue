<template>
    <div class="feather-icon" v-html="iconSVG"></div>
</template>
<script>
import feather from 'feather-icons';

const validIcons = Object.keys(feather.icons);

export default {
    props: {
        name: {
            type: String,
            required: true,
            validator(value) {
                const valid = validIcons.includes(value);
                if (!valid) {
                    console.warn(`name property for feather-icon must be one of `, validIcons);
                }
                return valid;
            }
        },
        size: {
            type: Number,
            default: 16
        }
    },
    computed: {
        iconSVG() {
          const icon = feather.icons[this.name];
          if (!icon) {
            return '';
          }
          return icon.toSvg({
              width: this.size,
              height: this.size
          });
        }
    }
}
</script>
<style>
.feather-icon {
    display: inline-flex;
}
</style>

