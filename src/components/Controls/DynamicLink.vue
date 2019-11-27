<script>
import Link from './Link';
export default {
  name: 'DynamicLink',
  props: ['target'],
  extends: Link,
  created() {
    this.targetWatcher = this.$watch(`doc.${this.df.references}`, function(newTarget, oldTarget) {
      if (oldTarget && newTarget !== oldTarget) {
        this.triggerChange('');
      }
    });
  },
  destroyed() {
    this.targetWatcher();
  },
  methods: {
    getTarget() {
      if (!this.doc) {
        throw new Error('You must provide `doc` for DynamicLink to work.');
      }
      return this.doc[this.df.references];
    }
  }
};
</script>
