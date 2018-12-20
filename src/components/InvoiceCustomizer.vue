<template>
  <div>
	<div v-if="doc" class="p-4">
		<div class="row">
			<div class="col-6 text-center">
				<h4>Customizer</h4>
			</div>
			<div class="col-6 text-right">
				<f-button secondary @click="$emit('closeInvoiceCustomizer')">{{ _('Close') }}</f-button>
			</div>
		</div>
		<div class="row">
			<div class="col-12 mt-4">
				<form-layout
					:doc="doc"
					:fields="fields"
					@updateDoc="saveDoc"
				/>
				<sketch-picker v-model="color"/>	
			</div>
		</div>
	</div>
  </div>
</template>
<script>
import FormLayout from 'frappejs/ui/components/Form/FormLayout';
import { Sketch } from 'vue-color';

export default {
	name: 'InvoiceCustomizer',
	components: {
		FormLayout,
		'sketch-picker': Sketch
  	},
  	data() {
		return {
			doc: null,
			fields: [],
			color: null,
		}
	},
	async created() {
		this.doc = await frappe.getDoc('InvoiceSettings');
	  	this.color = this.doc.themeColor;
		const meta = frappe.getMeta('InvoiceSettings');
		this.fields = meta.fields.filter((field) => field.fieldname !== "numberSeries");
	},
  	methods: {
		async saveDoc(updatedValue) {
			let { value } = updatedValue;
			this.$emit('changeTemplate', value);
			await this.doc.update();
    	}
  	},
  	watch: {
		color: async function() {
	  		if (this.doc) {
				if (this.doc.themeColor != this.color.hex) {
					this.doc.themeColor = this.color.hex;
					this.$emit('changeColor', this.color.hex);
					await this.doc.update();
	  			}
			}
		}
  	}
};
</script>
