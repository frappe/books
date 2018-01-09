const control_classes = {
	Data: require('./data')
}


module.exports = {
	get_control_class(fieldtype) {
		return control_classes[fieldtype];
	},
	make_control(field, parent) {
		const control_class = this.get_control_class(field.fieldtype);
		let control = new control_class(field, parent);
		control.make();
		return control;
	}
}