<script>
import Link from './Link';
export default {
  name: 'DynamicLink',
  props: ['target'],
  extends: Link,
  created() {
    let watchKey = `doc.${this.df.references}`;
    this.targetWatcher = this.$watch(watchKey, function(newTarget, oldTarget) {
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
