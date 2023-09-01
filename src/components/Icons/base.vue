<script>
import { uicolors } from 'src/utils/colors';

export default {
  name: 'IconBase',
  props: ['active'],
  computed: {
    lightColor() {
      return this.active ? uicolors.gray['600'] : uicolors.gray['400'];
    },
    darkColor() {
      return this.active ? uicolors.gray['800'] : uicolors.gray['600'];
    },
  },
};
</script>
