<template>
  <div>
    <PageHeader :title="t`Template Builder`">Hi</PageHeader>
    <!-- Template Builder Body -->
    <div class="w-full h-full flex" v-if="doc">
      <!-- Print View Container -->
      <div></div>

      <!-- Template Builder Controls -->
      <div class="w-quick-edit h-full right-0 ml-auto border-l flex flex-col">
        <!-- Print Template Fields -->
        <div class="p-4 flex flex-col gap-4">
          <FormControl
            :df="fields.name"
            :border="true"
            :value="doc.get('name')"
            @change="async (value) => await doc?.set('name', value)"
          />
        </div>

        <!-- Controls -->
        <div class="p-4 border-t">
          <div
            class="flex justify-between items-center cursor-pointer select-none"
            :class="helpersCollapsed ? '' : 'mb-4'"
            @click="helpersCollapsed = !helpersCollapsed"
          >
            <h2 class="text-base text-gray-900 font-semibold">
              {{ t`Controls` }}
            </h2>
            <feather-icon
              :name="helpersCollapsed ? 'chevron-up' : 'chevron-down'"
              class="w-4 h-4 text-gray-600 resize-none"
            />
          </div>

          <!-- 
            TODO: 
            - Select Test Doc
            - View Template Data and Keys
           -->
          <div v-if="!helpersCollapsed" class="w-full flex flex-col gap-4">
            <FormControl
              :df="fields.type"
              :show-label="true"
              :border="true"
              :value="doc.get('type')"
              @change="async (value) => await doc?.set('type', value)"
            />

            <FormControl
              v-if="doc.type"
              :df="displayDocField"
              :show-label="true"
              :border="true"
              :value="displayDoc?.name"
              @change="(value: string) => setDisplayDoc(value)"
            />

            <FormControl
              v-if="doc.isCustom"
              :df="fields.isCustom"
              :show-label="true"
              :border="true"
              :value="doc.get('isCustom')"
            />
          </div>
        </div>

        <!-- Template -->
        <div class="p-4 border-t">
          <div
            class="flex justify-between items-center cursor-pointer select-none"
            @click="templateCollapsed = !templateCollapsed"
          >
            <h2 class="text-base text-gray-900 font-semibold">
              {{ t`Template` }}
            </h2>
            <feather-icon
              :name="templateCollapsed ? 'chevron-up' : 'chevron-down'"
              class="w-4 h-4 text-gray-600"
            />
          </div>

          <!-- Template Container -->
          <textarea
            v-if="!templateCollapsed"
            :spellcheck="false"
            rows="20"
            class="
              overflow-auto
              mt-4
              p-2
              w-full
              border
              rounded
              text-sm text-gray-900
              focus-within:bg-gray-100
              outline-none
              bg-gray-50
            "
            style="
              font-family: monospace;
              white-space: pre;
              overflow-wrap: normal;
            "
          />
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import { PrintTemplate } from 'models/baseModels/PrintTemplate';
import { ModelNameEnum } from 'models/types';
import { Field, TargetField } from 'schemas/types';
import FormControl from 'src/components/Controls/FormControl.vue';
import PageHeader from 'src/components/PageHeader.vue';
import { getDocFromNameIfExistsElseNew } from 'src/utils/ui';
import { getMapFromList } from 'utils/index';
import { computed, defineComponent } from 'vue';

export default defineComponent({
  props: { name: String },
  components: { PageHeader, FormControl },
  provide() {
    return { doc: computed(() => this.doc) };
  },
  data() {
    return {
      doc: null,
      templateCollapsed: false,
      helpersCollapsed: true,
      displayDoc: null,
    } as {
      doc: PrintTemplate | null;
      displayDoc: PrintTemplate | null;
      templateCollapsed: boolean;
      helpersCollapsed: boolean;
    };
  },
  async mounted() {
    // @ts-ignore
    window.tb = this;
    await this.setDoc();

    if (!this.doc?.template) {
      this.helpersCollapsed = false;
    }
  },
  methods: {
    async setDoc() {
      if (this.doc) {
        return;
      }

      this.doc = (await getDocFromNameIfExistsElseNew(
        ModelNameEnum.PrintTemplate,
        this.name
      )) as PrintTemplate;
    },
    async setDisplayDoc(value: string) {
      if (!value) {
        this.displayDoc = null;
        return;
      }

      const schemaName = this.doc?.type;
      if (!schemaName) {
        return;
      }

      this.displayDoc = await getDocFromNameIfExistsElseNew(schemaName, value);
    },
  },
  computed: {
    fields(): Record<string, Field> {
      return getMapFromList(
        this.fyo.schemaMap.PrintTemplate?.fields ?? [],
        'fieldname'
      );
    },
    displayDocField(): TargetField {
      const target = this.doc?.type ?? ModelNameEnum.SalesInvoice;
      return {
        fieldname: 'displayDoc',
        label: this.t`Display Doc`,
        fieldtype: 'Link',
        target,
      };
    },
  },
});
</script>
