const frappe = require('frappejs');
const utils = require('frappejs/client/ui/utils');
const slideConfigs = require('./config');
const Tree = require('frappejs/client/ui/tree');
const FormLayout = require('frappejs/client/view/formLayout');
const Observable = require('frappejs/utils/observable');

module.exports = class SetupWizard {
	constructor() {
		this.slideCount = slideConfigs.layout.length;
		this.indicatorList = [];

		this.currentIndex = 0;
		this.doc = new Observable();

		this.promise = new Promise(resolve => {
			this.onComplete = resolve;
		});

		this.footerButtons = [
			{
				label: 'Prev', name: 'prev',
				action: this.prevSlide.bind(this),
				condition: index => index !== 0
			},
			{
				label: 'Next', name: 'next',
				action: this.nextSlide.bind(this),
				condition: index => index !== this.slideCount - 1
			},
			{
				label: 'Complete', name: 'complete',
				action: this.onComplete.bind(this, this.doc),
				condition: index => index === this.slideCount - 1
			}
		];

		this.make();
	}

	async start() {
		this.showSlide(0);
		return this.promise;
	}

	make() {
		let body = document.querySelector('body');
		this.container = frappe.ui.add('form', 'setup-container container', body);
		this.$indicators = frappe.ui.add('div', 'indicators vertical-margin align-center', this.container);

		this.makeSlides();
		this.makeButtons();
	}

	makeSlides() {
		this.formLayout = new FormLayout(Object.assign(slideConfigs, {
			doc: this.doc
		}));
		this.container.appendChild(this.formLayout.form);

		slideConfigs.layout.forEach(() => {
			// indicator for each section
			let indicator = frappe.ui.create('span', {
				inside: this.$indicators,
				className: 'indicator gray'
			});
			this.indicatorList.push(indicator);
		});

	}

	makeButtons() {
		this.linkArea = frappe.ui.add('div', 'setup-link-area align-right', this.container);

		this.footerButtons.map(link => {
			link.element = utils.addButton(link.label, this.linkArea, link.action);
		});
	}

	showSlide(index) {
		this.currentIndex = index;
		utils.activate(this.container, `.form-section:nth-child(${index + 1})`, '.form-section', 'active');
		this.activateIndicator(index);
		this.showFooterLinks(index);
	}

	prevSlide() {
		this.showSlide(this.currentIndex - 1);
	}

	nextSlide() {
		const isValid = this.validateCurrentSlide();
		frappe.ui.toggleClass(this.formLayout.sections[this.currentIndex], 'was-validated', !isValid);

		if (isValid) {
			this.showSlide(this.currentIndex + 1);
		}
	}

	validateCurrentSlide() {
		const fields = this.getFieldsInSlide(this.currentIndex);
		const inputValidityMap = fields.map(field => this.formLayout.controls[field].input.checkValidity());
		const isValid = !inputValidityMap.includes(false);
		return isValid;
	}

	getFieldsInSlide(index) {
		const visibleSection = slideConfigs.layout[index];
		const fieldsInSlide = visibleSection.fields ||
			visibleSection.columns.reduce(
				(col, fields) => fields.concat(col.fields), []
			);

		return fieldsInSlide;
	}

	activateIndicator(index) {
		this.indicatorList.forEach(indicator => indicator.classList.add('gray'));
		let indicator = this.indicatorList[index];
		utils.activate(this.$indicators, indicator, '.gray', 'blue', index);

		frappe.ui.removeClass(indicator, 'gray');
		indicator.classList.remove('gray');
	}

	showFooterLinks(index) {
		this.footerButtons.map(link => {
			const show = link.condition(this.currentIndex);
			if (show) {
				link.element.classList.remove('hide');
			} else {
				link.element.classList.add('hide');
			}
		})
	}
}
