<script>
import Link from './Link.vue';
export default {
  name: 'DynamicLink',
  props: ['target'],
  extends: Link,
  created() {
    const watchKey = `doc.${this.df.references}`;
    this.targetWatcher = this.$watch(watchKey, function (newTarget, oldTarget) {
      if (oldTarget && newTarget !== oldTarget) {
        this.triggerChange('');
      }
    });
  },
  unmounted() {
    this.targetWatcher();
  },
  methods: {
    getTargetSchemaName() {
      if (!this.doc || !this.df.references) {
        return null;
      }

      return this.doc[this.df.references];
    },
  },
};
</script>
