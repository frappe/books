<script>
import feather from 'feather-icons';
import { h } from 'vue';

const validIcons = Object.keys(feather.icons);

export default {
  props: {
    name: {
      type: String,
      required: true,
      validator: (value) => validIcons.includes(value),
    },
  },
  render() {
    const icon = feather.icons[this.name];
    const svg = h('svg', {
      ...Object.assign({}, icon.attrs, {
        fill: 'none',
        stroke: 'currentColor',
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': 1.5,
        width: null,
        height: null,
      }),
      class: [icon.attrs.class],
      innerHTML: icon.contents,
    });

    return svg;
  },
};
</script>
