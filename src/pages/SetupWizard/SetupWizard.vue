<template>
  <div
    class="flex-1 bg-gray-25 flex justify-center items-center"
    :class="{ 'window-drag': platform !== 'Windows' }"
  >
    <!-- Setup Wizard Slide -->
    <Slide
      :primary-disabled="!valuesFilled || loading"
      :secondary-disabled="loading"
      @primary-clicked="submit()"
      @secondary-clicked="$emit('setup-canceled')"
      :class="{ 'window-no-drag': platform !== 'Windows' }"
    >
      <template #title>
        {{ t`Set up your organization` }}
      </template>

      <template #content>
        <div v-if="doc">
          <!-- Image Section -->
          <div class="flex items-center p-4 gap-4">
            <FormControl
              :df="getField('logo')"
              :value="doc.logo"
              :read-only="loading"
              @change="(value) => setValue('logo', value)"
            />
            <div>
              <FormControl
                ref="companyField"
                :df="getField('companyName')"
                :value="doc.companyName"
                :read-only="loading"
                @change="(value) => setValue('companyName', value)"
                input-class="
                  font-semibold
                  text-xl
                "
                :autofocus="true"
              />
              <FormControl
                :df="getField('email')"
                :value="doc.email"
                :read-only="loading"
                @change="(value) => setValue('email', value)"
              />
            </div>
          </div>

          <p
            class="-mt-6 text-sm absolute text-red-400 w-full"
            style="left: 7.75rem"
            v-if="emailError"
          >
            {{ emailError }}
          </p>

          <TwoColumnForm :doc="doc" :read-only="loading" />
          <Button
            v-if="fyo.store.isDevelopment"
            class="m-4 text-sm min-w-28"
            @click="fill"
            >Fill</Button
          >
        </div>
      </template>
      <template #secondaryButton>{{ t`Cancel` }}</template>
      <template #primaryButton>{{
        loading ? t`Setting up...` : t`Submit`
      }}</template>
    </Slide>
  </div>
</template>

<script>
import Button from 'src/components/Button.vue';
import FormControl from 'src/components/Controls/FormControl.vue';
import TwoColumnForm from 'src/components/TwoColumnForm.vue';
import { getErrorMessage } from 'src/utils';
import { getSetupWizardDoc } from 'src/utils/misc';
import { showMessageDialog } from 'src/utils/ui';
import Slide from './Slide.vue';

export default {
  name: 'SetupWizard',
  emits: ['setup-complete', 'setup-canceled'],
  data() {
    return {
      doc: null,
      loading: false,
      valuesFilled: false,
      emailError: null,
    };
  },
  provide() {
    return {
      schemaName: 'SetupWizard',
      name: 'SetupWizard',
    };
  },
  components: {
    TwoColumnForm,
    FormControl,
    Slide,
    Button,
  },
  async mounted() {
    this.doc = await getSetupWizardDoc();
    this.doc.on('change', () => {
      this.valuesFilled = this.allValuesFilled();
    });
  },
  methods: {
    async fill() {
      await this.doc.set('companyName', "Lin's Things");
      await this.doc.set('email', 'lin@lthings.com');
      await this.doc.set('fullname', 'Lin Slovenly');
      await this.doc.set('bankName', 'Max Finance');
      await this.doc.set('country', 'India');
    },
    getField(fieldname) {
      return this.doc.schema?.fields.find((f) => f.fieldname === fieldname);
    },
    setValue(fieldname, value) {
      this.emailError = null;
      this.doc.set(fieldname, value).catch((e) => {
        if (fieldname === 'email') {
          this.emailError = getErrorMessage(e, this.doc);
        }
      });
    },
    allValuesFilled() {
      const values = this.doc.schema.fields
        .filter((f) => f.required)
        .map((f) => this.doc[f.fieldname]);
      return values.every(Boolean);
    },
    async submit() {
      if (!this.allValuesFilled()) {
        return await showMessageDialog({
          message: this.t`Please fill all values`,
        });
      }

      this.loading = true;
      this.$emit('setup-complete', this.doc.getValidDict());
    },
  },
};
</script>
