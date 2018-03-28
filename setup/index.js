const frappe = require('frappejs');
const utils = require('frappejs/client/ui/utils');
const slideConfigs = require('./config');
const Tree = require('frappejs/client/ui/tree');
const FormLayout = require('frappejs/client/view/formLayout');

module.exports = class SetupWizard {
	constructor({postSetup = () => {}}) {
		this.slideList = [];
		this.indicatorList = [];
		this.currentIndex = 0;
		this.footerLinks = {};
		this.data = {};

		this.postSetup = postSetup;
		let body = document.querySelector('body');

		// container
		this.container = frappe.ui.add('form', 'setup-container container', body);

		// dots
		this.$indicators = frappe.ui.add('div', 'indicators vertical-margin align-center', this.container);

		// make form
		slideConfigs.forEach(config => {
			this.formLayout = new FormLayout(config);
			this.slideList.push(this.formLayout);
			let form = this.formLayout.form;

			let title = document.createElement('h3');
			title.innerHTML = config.title;
			title.classList.add('text-extra-muted');
			form.insertBefore(title, form.firstChild);
			this.container.appendChild(form);

			let indicator = document.createElement('span');
			indicator.classList.add('indicator', 'gray');
			this.indicatorList.push(indicator);
			this.$indicators.appendChild(indicator);
		});

		// make links
		this.linkArea = frappe.ui.add('div', 'setup-link-area align-right', this.container);
		let links = [
			{
				label: 'Prev',
				name: 'prev',
				action: () => {
					this.prevSlide();
				}
			},
			{
				label: 'Next',
				name: 'next',
				action: () => {
					this.nextSlide();
				}
			},
			{
				label: 'Complete',
				name: 'complete',
				action: (data) => {
					this.postSetup();
				}
			}
		];

        // this.formLayout.on('change', () => {
        //     const show = this.doc._dirty && !this.doc.submitted;
        //     this.saveButton.classList.toggle('hide', !show);
        // });

		links.map(link => {
			let $link = utils.addLink(link.label, this.linkArea, () => {
				link.action(this.data);
			});
			this.footerLinks[link.name] = $link;
		})

		this.showSlide(this.currentIndex);
	}

	make() {
		//
	}

	showSlide(index) {
		utils.activate(this.container, this.slideList[index].form, 'form-body', 'active');
		this.slideList[index].controlList[0].input.blur();
		this.activateIndicator(index);
		this.setFooterLinks(index);
		this.currentIndex = index;
	}

	activateIndicator(index) {
		this.indicatorList.forEach(indicator => {indicator.classList.add('gray')});
		let indicator = this.indicatorList[index];
		utils.activate(this.$indicators, indicator, 'gray', 'blue', index);

		frappe.ui.removeClass(indicator, 'gray');
		indicator.classList.remove('gray');
	}

	prevSlide() {
		this.showSlide(this.currentIndex - 1);
	}

	nextSlide() {
		this.showSlide(this.currentIndex + 1);
	}

	setFooterLinks(index) {
		if(index === 0) {
			this.footerLinks.prev.classList.add('hide');
			this.footerLinks.next.classList.remove('hide');
			this.footerLinks.complete.classList.add('hide');
		} else if (index === this.slideList.length - 1) {
			this.footerLinks.prev.classList.remove('hide');
			this.footerLinks.next.classList.add('hide');
			this.footerLinks.complete.classList.remove('hide');
		} else {
			this.footerLinks.prev.classList.remove('hide');
			this.footerLinks.next.classList.remove('hide');
			this.footerLinks.complete.classList.add('hide');
		}

	}
}
