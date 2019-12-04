<script>
export default {
  name: 'WithScroll',
  mounted() {
    let handler = () => {
      let { scrollLeft, scrollTop } = this.$el;
      this.$emit('scroll', { scrollLeft, scrollTop });
    };
    this.$el.addEventListener('scroll', handler);
    this.$once('hook:beforeDestroy', () => {
      this.$el.removeEventListener('scroll', handler);
    });
  },
  render() {
    return this.$slots.default[0];
  }
};
</script>
