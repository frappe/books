<template>
  <div class="setup-wizard d-flex justify-content-center">
    <div class="col-4 border rounded shadow-sm p-4 mt-5">
      <div v-if="showForm" key="setup-wizard-form">
        <h4 class="text-center">Setup your account</h4>
        <div class="progress-indicator d-flex justify-content-center p-4">
          <indicator class="mr-1" :color="indicatorColor(index)" v-for="(section, index) in layout.sections" :key="index" />
        </div>
        <form-layout
          :doc="doc"
          :fields="fields"
          :layout="layout"
          :currentSection="currentSection"
        />
        <div class="d-flex justify-content-between">
          <div>
            <f-button secondary v-if="currentSection > 0"
              @click="prevSection">
              Prev
            </f-button>
          </div>
          <div>
            <f-button primary v-if="currentSection < layout.sections.length - 1"
              @click="nextSection">
              Next
            </f-button>
            <f-button primary v-if="currentSection === layout.sections.length - 1"
              @click="submit">
              Complete
            </f-button>
          </div>
        </div>
      </div>
      <div class="d-flex flex-column justify-content-center align-items-center" v-else key="setup-wizard-loading-screen">
        <feather-icon class="loading-icon" name="loader" />
        <span class="text-muted text-center">
          {{ _('Hang tight.') }}<br>{{ _('We are setting up your account.') }}
        </span>
      </div>
    </div>
  </div>
</template>
<script>
import frappe from 'frappejs';
import Observable from 'frappejs/utils/observable';
import FormLayout from 'frappejs/ui/components/Form/FormLayout';
import indicatorColor from 'frappejs/ui/constants/indicators';
import setupConfig from './config';

export default {
  name: 'SetupWizard',
  data() {
    return {
      currentSection: 0,
      showForm: true
    };
  },
  components: {
    FormLayout
  },
  created() {
    this.doc = new Observable();
  },
  methods: {
    async submit() {
      this.showForm = false;
      this.$emit('complete', this.doc);
    },
    nextSection() {
      this.currentSection += 1;
    },
    prevSection() {
      this.currentSection -= 1;
    },
    indicatorColor(i) {
      return i === this.currentSection
        ? indicatorColor.BLUE
        : indicatorColor.GREY;
    }
  },
  computed: {
    fields() {
      return setupConfig.fields;
    },
    layout() {
      return setupConfig.layout;
    }
  }
};
</script>
<style scoped>
.loading-icon {
  height: 24px;
  animation: rotation 1s infinite linear;
  transform-origin: 50% 50%;
}

@keyframes rotation {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(359deg);
  }
}
</style>
