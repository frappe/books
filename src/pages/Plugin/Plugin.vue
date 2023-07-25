<template>
  <div>
    <PageHeader :title="title">
      <Button v-if="!doc?.info" @click="selectPluginFile">{{
        t`Select Plugin`
      }}</Button>
      <Button
        v-if="doc?.canSave && doc.data && !exists"
        type="primary"
        @click="installPlugin()"
      >
        {{ t`Install` }}
      </Button>
      <Button
        v-if="doc?.canSave && doc.data && exists"
        type="primary"
        @click="updatePlugin()"
      >
        {{ t`Update` }}
      </Button>
      <Button v-if="doc?.canDelete" @click="deletePlugin()">{{
        t`Delete`
      }}</Button>
    </PageHeader>
    <div v-if="info" class="p-4 text-sm">
      <pre>{{ JSON.stringify(info, null, 2) }}</pre>
    </div>
  </div>
</template>
<script lang="ts">
import { Doc } from 'fyo/model/doc';
import { Plugin } from 'fyo/models/Plugin';
import { ModelNameEnum } from 'models/types';
import Button from 'src/components/Button.vue';
import PageHeader from 'src/components/PageHeader.vue';
import { showDialog, showToast } from 'src/utils/interactive';
import { commonDocSync, deleteDocWithPrompt } from 'src/utils/ui';
import { PluginInfo } from 'utils/types';
import { defineComponent } from 'vue';

/**
 * TODO:
 * - [ ] Display plugin README.md
 * - [ ] Display plugin info properly
 */

export default defineComponent({
  components: { PageHeader, Button },
  props: { name: { type: String, required: true } },
  data() {
    return {
      info: null as null | PluginInfo,
      doc: null as null | Plugin,
      exists: false as boolean,
    };
  },
  computed: {
    title(): string {
      if (this.info) {
        return this.info.name;
      }

      return '';
    },
  },
  async mounted() {
    if (this.name) {
      try {
        this.doc = await this.fyo.doc.get(ModelNameEnum.Plugin, this.name);
      } catch {
        this.doc = this.fyo.doc.new(ModelNameEnum.Plugin);
      }
    } else {
      this.doc = this.fyo.doc.new(ModelNameEnum.Plugin);
    }
    if (this.fyo.store.isDevelopment) {
      // @ts-ignore
      window.p = this;
    }

    this.setInfo();
  },
  methods: {
    setInfo(info?: string) {
      info ??= this.doc?.info;
      if (!info) {
        return;
      }

      this.info = JSON.parse(info) as PluginInfo;
    },
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
      this.setInfo(data.info);
      this.exists = await this.fyo.db.exists(
        ModelNameEnum.Plugin,
        this.info?.name ?? ''
      );

      await this.doc?.set(data);
    },
    async installPlugin() {
      if (!this.doc) {
        return;
      }

      const success = await commonDocSync(this.doc as Doc, true);
      if (success) {
        this.showReloadToast();
      }
    },
    async updatePlugin() {
      const { name, info, data } = this.doc ?? {};

      if (!name || !info || !data) {
        return;
      }

      const oldDoc = (await this.fyo.doc.get(
        ModelNameEnum.Plugin,
        name
      )) as Plugin;

      const newInfo = JSON.parse(info) as PluginInfo;
      const oldInfo = JSON.parse(oldDoc.info ?? '{}') as PluginInfo;

      let message = this
        .t`Plugin ${name} exists, update data with selected file?`;

      if (
        oldInfo.version !== newInfo.version &&
        oldInfo.name === newInfo.name
      ) {
        message = this
          .t`Update plugin data from version ${oldInfo.version} to ${newInfo.version}?`;
      }

      const success = await showDialog({
        title: this.t`Update ${name}`,
        message,
        buttons: [
          {
            label: this.t`Yes`,
            async action() {
              await oldDoc.set({ info, data });
              await oldDoc.sync();
              return true;
            },
          },
          {
            label: this.t`No`,
            action() {
              return false;
            },
          },
        ],
      });

      if (success) {
        this.doc = oldDoc;
        this.showReloadToast();
      }
    },
    async deletePlugin() {
      if (!this.doc) {
        return;
      }

      const success = await deleteDocWithPrompt(this.doc as Doc);
      if (success) {
        const route = `/list/Plugin/${this.t`Plugins`}`;
        await this.$router.replace(route);
        this.showReloadToast();
      }
    },
    showReloadToast() {
      showToast({
        message: this.t`Changes will be visible on reload`,
        action: () => ipc.reloadWindow(),
        actionText: this.t`Reload Frappe Books?`,
      });
    },
  },
});
</script>
