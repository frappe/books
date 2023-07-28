<template>
  <div>
    <PageHeader :title="t`Customize Form`">
      <DropdownWithActions :actions="[]" :disabled="false" :title="t`More`" />
      <Button :title="t`Save Customizations`" type="primary">
        {{ t`Save` }}
      </Button>
    </PageHeader>
  </div>
</template>
<script lang="ts">
import { defineComponent } from 'vue';

import DropdownWithActions from 'src/components/DropdownWithActions.vue';
import Button from 'src/components/Button.vue';
import PageHeader from 'src/components/PageHeader.vue';

export default defineComponent({
  components: { PageHeader, Button, DropdownWithActions },
});
</script>
