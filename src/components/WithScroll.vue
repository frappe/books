<script>
export default {
  name: 'WithScroll',
  mounted() {
    this.listener = () => {
      let { scrollLeft, scrollTop } = this.$el;
      this.$emit('scroll', { scrollLeft, scrollTop });
    };
    this.$el.addEventListener('scroll', this.listener);
  },
  beforeUnmount() {
    if (this.listener) {
      this.$el.removeEventListener('scroll', this.listener);
      delete this.listener;
    }
  },
  render() {
    return this.$slots.default[0];
  },
};
</script>
