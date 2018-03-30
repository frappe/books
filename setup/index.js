const frappe = require('frappejs');
const utils = require('frappejs/client/ui/utils');
const slideConfigs = require('./config');
const Tree = require('frappejs/client/ui/tree');
const FormLayout = require('frappejs/client/view/formLayout');

module.exports = class SetupWizard {
	constructor({postSetup = () => {}}) {
		this.slideList = [];
		this.indicatorList = [];
		this.footerLinks = {};

		this.currentIndex = 0;
		this.data = {};

		this.postSetup = postSetup;
		this.make();

		this.showSlide(this.currentIndex);
	}

	make() {
		let body = document.querySelector('body');
		this.container = frappe.ui.add('form', 'setup-container container', body);
		this.$indicators = frappe.ui.add('div', 'indicators vertical-margin align-center', this.container);

		this.makeSlides();
		this.makeLinks();
	}

	makeSlides() {
		slideConfigs.forEach(config => {
			this.formLayout = new FormLayout(config);
			this.slideList.push(this.formLayout);
			let form = this.formLayout.form;
			this.container.appendChild(form);

			let title = frappe.ui.create('h3', {
				className: 'text-extra-muted',
				innerHTML: config.title
			})
			form.insertBefore(title, form.firstChild);

			let indicator = frappe.ui.create('span', {
				inside: this.$indicators,
				className: 'indicator gray'
			})
			this.indicatorList.push(indicator);
		});
	}

	makeLinks() {
		this.linkArea = frappe.ui.add('div', 'setup-link-area align-right', this.container);

        // this.formLayout.on('change', () => {
        //     const show = this.doc._dirty && !this.doc.submitted;
        //     this.saveButton.classList.toggle('hide', !show);
        // });

		this.getFooterLinks().map(link => {
			let $link = utils.addLink(link.label, this.linkArea, () => {
				this.buildData();
				link.action(this.data);
			});
			this.footerLinks[link.name] = $link;
		})
	}

	buildData() {
		this.data = {};
		this.slideList.forEach(slide => {
			Object.assign(this.data, slide.doc);
		});
	}

	showSlide(index) {
		utils.activate(this.container, this.slideList[index].form, 'form-body', 'active');
		this.slideList[index].controlList[0].input.blur();
		this.activateIndicator(index);
		this.showFooterLinks(index);
		this.currentIndex = index;
	}

	prevSlide() {
		this.showSlide(this.currentIndex - 1);
	}

	nextSlide() {
		this.showSlide(this.currentIndex + 1);
	}

	activateIndicator(index) {
		this.indicatorList.forEach(indicator => {indicator.classList.add('gray')});
		let indicator = this.indicatorList[index];
		utils.activate(this.$indicators, indicator, 'gray', 'blue', index);

		frappe.ui.removeClass(indicator, 'gray');
		indicator.classList.remove('gray');
	}

	showFooterLinks(index) {
		let mat = [1, 1, 0]
		if(index === 0) {
			mat = [0, 1, 0];
		} else if (index === this.slideList.length - 1) {
			mat = [1, 0, 1];
		}
		this.showHideLinks(mat);
	}

	showHideLinks(matrix = [1, 1, 0]) {
		let linkNames = this.getFooterLinks().map(link => link.name);
		matrix.forEach((value, i) => {
			const fn = value ? 'remove' : 'add';
			this.footerLinks[linkNames[i]].classList[fn]('hide');
		});
	}

	getFooterLinks() {
		return [
			{
				label: 'Prev', name: 'prev',
				action: this.prevSlide.bind(this)
			},
			{
				label: 'Next', name: 'next',
				action: this.nextSlide.bind(this)
			},
			{
				label: 'Complete', name: 'complete',
				action: this.postSetup.bind(this)
			}
		];
	}
}
