<template>
  <div>
    <PageHeader :title="doc && doc.inserted ? doc.name : ''">
      <Button @click="selectPluginFile">{{ t`Select Plugin` }}</Button>
      <Button
        v-if="doc?.canSave && doc.data"
        type="primary"
        @click="doc.sync()"
      >
        {{ t`Save` }}
      </Button>
    </PageHeader>
    <div class="p-4 text-sm">
      <pre>{{ JSON.stringify(JSON.parse(doc?.info || '{}'), null, 2) }}</pre>
    </div>
  </div>
</template>
<script lang="ts">
import { ModelNameEnum } from 'models/types';
import PageHeader from 'src/components/PageHeader.vue';
import Button from 'src/components/Button.vue';
import { defineComponent } from 'vue';
import { Plugin } from 'fyo/models/Plugin';

export default defineComponent({
  components: { PageHeader, Button },
  props: { name: { type: String, required: true } },
  data() {
    return { doc: null as null | Plugin };
  },
  async mounted() {
    if (this.name) {
      this.doc = await this.fyo.doc.get(ModelNameEnum.Plugin, this.name);
    } else {
      this.doc = this.fyo.doc.new(ModelNameEnum.Plugin);
    }
    if (this.fyo.store.isDevelopment) {
      // @ts-ignore
      window.p = this;
    }
  },
  methods: {
    async selectPluginFile() {
      const { filePath } = await ipc.selectFile({
        title: this.t`Select Plugin File`,
        filters: [
          { name: 'Frappe Books Plugin', extensions: ['books_plugin'] },
        ],
      });

      if (!filePath) {
        return;
      }

      const data = await ipc.getPluginData(filePath);
      await this.doc?.set(data);
    },
  },
});
</script>
