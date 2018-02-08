const control_classes = {
    Data: require('./data'),
    Text: require('./text'),
    Select: require('./select'),
    Link: require('./link'),
    Float: require('./float'),
    Currency: require('./currency'),
    Password: require('./password'),
    Table: require('./table')
}

module.exports = {
    getControlClass(fieldtype) {
        return control_classes[fieldtype];
    },
    makeControl({field, form, parent}) {
        const control_class = this.getControlClass(field.fieldtype);
        let control = new control_class({field:field, form:form, parent:parent});
        control.make();
        return control;
    }
}