<template>
  <Modal :open-modal="openModal" @closemodal="$emit('close')">
    <div class="w-form">
      <div class="mb-4">
        <FormHeader
          :form-title="label"
          :form-sub-title="t`Customize Columns`"
        />
      </div>

      <div class="max-h-96 overflow-y-auto">
        <div v-if="verticalFields.length > 0" class="mb-4">
          <h2
            class="text-sm font-semibold text-gray-800 dark:text-gray-300 ml-4"
          >
            {{ t`Displayed Fields` }}
          </h2>
          <div
            class="
              flex flex-col
              border
              dark:border-gray-800
              rounded
              p-2
              max-h-64
              overflow-y-auto
            "
            @dragover.prevent
            @drop="handleDrop($event, null)"
          >
            <div
              v-for="(field, index) in verticalFields"
              :key="field.fieldname"
              class="cursor-move"
              draggable="true"
              @dragstart="handleDragStart($event, field.fieldname)"
              @dragover.prevent
              @drop="handleDrop($event, index)"
            >
              <Check
                :id="field.fieldname"
                :value="tempSelectedColumns.includes(field.fieldname)"
                :df="field"
                :label-right="true"
                :show-label="true"
                :read-only="false"
                @change="(value) => toggleField(field.fieldname, value)"
              />
            </div>
          </div>
        </div>

        <div v-if="horizontalFields.length > 0">
          <h2
            class="text-sm font-semibold text-gray-800 dark:text-gray-300 ml-4"
          >
            {{ t`Available Fields` }}
          </h2>
          <div
            class="grid grid-cols-3 border dark:border-gray-800 rounded mt-1"
            @dragover.prevent
            @drop="handleRemoveDrop($event)"
          >
            <div
              v-for="field in horizontalFields"
              :key="field.fieldname"
              class="cursor-move"
              draggable="true"
              @dragstart="handleDragStart($event, field.fieldname)"
            >
              <Check
                :id="field.fieldname"
                :value="tempSelectedColumns.includes(field.fieldname)"
                :df="field"
                :label-right="true"
                :show-label="true"
                :read-only="false"
                @change="(value: boolean) => addField(field.fieldname, value)"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="p-4 flex justify-end mt-6">
        <Button type="primary" @click="saveColumns">
          {{ t`Save` }}
        </Button>
      </div>
    </div>
  </Modal>
</template>

<script lang="ts">
import { Field } from 'schemas/types';
import Button from './Button.vue';
import Check from './Controls/Check.vue';
import FormHeader from './FormHeader.vue';
import Modal from './Modal.vue';
import { fyo } from 'src/initFyo';
import { defineComponent, PropType } from 'vue';

export default defineComponent({
  name: 'ColumnSelectorModal',
  components: {
    Modal,
    Button,
    Check,
    FormHeader,
  },
  props: {
    openModal: { type: Boolean, required: true },
    schemaName: { type: String, required: true },
    currentColumns: { type: Array as PropType<string[]>, required: true },
  },
  emits: ['close', 'columns-saved'],
  data() {
    return {
      selectedColumns: [] as string[],
      tempSelectedColumns: [] as string[],
    };
  },
  computed: {
    label(): string {
      return this.schemaName.replace(/([A-Z])/g, ' $1').trim();
    },
    availableFields(): Field[] {
      const schema = fyo.schemaMap[this.schemaName];
      if (!schema?.fields) return [];

      return schema.fields.filter(
        (field) => field.fieldtype !== 'Table' && !field.hidden
      );
    },
    verticalFields(): Field[] {
      return this.tempSelectedColumns
        .map((fieldname) =>
          this.availableFields.find((field) => field.fieldname === fieldname)
        )
        .filter(Boolean) as Field[];
    },
    horizontalFields(): Field[] {
      return this.availableFields.filter(
        (field) => !this.tempSelectedColumns.includes(field.fieldname)
      );
    },
  },
  watch: {
    currentColumns: {
      handler() {
        this.selectedColumns = this.initializeSelectedColumns();
        this.tempSelectedColumns = [...this.selectedColumns];
      },
      immediate: true,
      deep: true,
    },

    openModal(newVal) {
      if (newVal) {
        this.selectedColumns = this.initializeSelectedColumns();
        this.tempSelectedColumns = [...this.selectedColumns];
      }
    },
  },
  mounted() {
    this.selectedColumns = this.initializeSelectedColumns();
    this.tempSelectedColumns = [...this.selectedColumns];
  },
  methods: {
    initializeSelectedColumns() {
      return [...this.currentColumns];
    },
    saveColumns() {
      this.selectedColumns = [...this.tempSelectedColumns];
      this.$emit('columns-saved', this.selectedColumns);
      this.$emit('close');
    },
    toggleField(fieldname: string, checked: boolean) {
      const field = this.availableFields.find((f) => f.fieldname === fieldname);
      if (field?.required && !checked) {
        return;
      }
      if (checked) {
        if (!this.tempSelectedColumns.includes(fieldname)) {
          this.tempSelectedColumns.push(fieldname);
        }
      } else {
        const index = this.tempSelectedColumns.indexOf(fieldname);
        if (index > -1) {
          this.tempSelectedColumns.splice(index, 1);
        }
      }
    },
    handleDragStart(event: DragEvent, fieldname: string) {
      event.dataTransfer!.setData('text/plain', fieldname);
    },
    handleDrop(event: DragEvent, dropIndex: number | null) {
      event.preventDefault();
      const draggedFieldname = event.dataTransfer!.getData('text/plain');
      const draggedIndex = this.tempSelectedColumns.indexOf(draggedFieldname);

      if (draggedIndex === -1) {
        if (dropIndex === null) {
          this.tempSelectedColumns.push(draggedFieldname);
        } else {
          this.tempSelectedColumns.splice(dropIndex, 0, draggedFieldname);
        }
      } else {
        if (
          dropIndex !== null &&
          dropIndex !== draggedIndex &&
          dropIndex !== draggedIndex + 1
        ) {
          this.tempSelectedColumns.splice(draggedIndex, 1);
          this.tempSelectedColumns.splice(
            dropIndex > draggedIndex ? dropIndex - 1 : dropIndex,
            0,
            draggedFieldname
          );
        }
      }
    },
    handleRemoveDrop(event: DragEvent) {
      event.preventDefault();
      const draggedFieldname = event.dataTransfer!.getData('text/plain');
      const index = this.tempSelectedColumns.indexOf(draggedFieldname);
      if (index > -1) {
        this.tempSelectedColumns.splice(index, 1);
      }
    },
    addField(fieldname: string, checked: boolean) {
      if (checked) {
        if (!this.tempSelectedColumns.includes(fieldname)) {
          this.tempSelectedColumns.push(fieldname);
        }
      } else {
        const index = this.tempSelectedColumns.indexOf(fieldname);
        if (index > -1) {
          this.tempSelectedColumns.splice(index, 1);
        }
      }
    },
  },
});
</script>
