<template>
  <component
    v-bind="$attrs"
    v-on="$listeners"
    :is="iconComponent"
    :class="iconClasses"
    :active="active"
  />
</template>

<script>
const components = {};
const requireComponent = require.context('./Icons', true, /\w+\.(vue)$/);

requireComponent.keys().forEach(fileName => {
  const componentConfig = requireComponent(fileName);

  let match = fileName.match(/\.\/(\d+)\/((\w|-)+).vue/);
  let [, size, name] = match || [];

  if (name) {
    components[size] = components[size] || {};
    components[size][name] = componentConfig.default || componentConfig;
  }
});

export default {
  name: 'Icon',
  props: ['name', 'active', 'size', 'height'],
  computed: {
    iconComponent() {
      try {
        return components[this.size][this.name];
      } catch (error) {
        return null;
      }
    },
    iconClasses() {
      let sizeClass = {
        '8': 'w-2 h-2',
        '12': 'w-3 h-3',
        '16': 'w-4 h-4',
        '18': 'w-5 h-5',
        '24': 'w-6 h-6'
      }[this.size];

      if (this.height) {
        sizeClass = `w-${this.height} h-${this.height}`;
      }

      return [sizeClass, 'fill-current'];
    }
  }
};
</script>
