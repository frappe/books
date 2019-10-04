<template>
  <div class="mt-4 px-8 flex justify-between">
    <h1 class="text-xl font-bold" v-if="title">{{ title }}</h1>
    <div class="flex">
      <Button type="primary">
        <Add class="w-3 h-3 stroke-current text-white" />
      </Button>
      <SearchBar class="ml-2" />
    </div>
  </div>
</template>
<script>
import Button from './Button';
import Add from './Icons/Add';
import SearchBar from './SearchBar';

export default {
  props: ['title', 'breadcrumbs'],
  components: {
    Button,
    Add,
    SearchBar
  }
};
</script>
