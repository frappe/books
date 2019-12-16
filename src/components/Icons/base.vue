<script>
export default {
  name: 'IconBase',
  props: ['active'],
  computed: {
    lightColor() {
      return this.active ? '#8CC0F1' : '#A1ABB4';
    },
    darkColor() {
      return this.active ? '#4794E9' : '#415668';
    }
  }
};
</script>
