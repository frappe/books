<script>
import { uicolors } from 'src/utils/colors';

export default {
  name: 'IconBase',
  props: ['active'],
  computed: {
    lightColor() {
      return this.active ? uicolors.blue['300'] : uicolors.gray['500'];
    },
    darkColor() {
      return this.active ? uicolors.blue['500'] : uicolors.gray['700'];
    },
  },
};
</script>
