<script lang="ts">
import { uicolors } from 'src/utils/colors';

export default {
  name: 'IconBase',
  props: {
    active: Boolean,
    darkMode: Boolean,
  },
  computed: {
    lightColor(): string {
      const activeGray = this.darkMode
        ? uicolors.gray['500']
        : uicolors.gray['600'];
      const passiveGray = this.darkMode
        ? uicolors.gray['700']
        : uicolors.gray['400'];
      return this.active ? activeGray : passiveGray;
    },
    darkColor(): string {
      const activeGray = this.darkMode
        ? uicolors.gray['200']
        : uicolors.gray['800'];
      const passiveGray = this.darkMode
        ? uicolors.gray['500']
        : uicolors.gray['600'];
      return this.active ? activeGray : passiveGray;
    },
  },
};
</script>
