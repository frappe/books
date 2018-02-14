const control_classes = {
    Data: require('./data'),
    Date: require('./date'),
    Currency: require('./currency'),
    Float: require('./float'),
    Int: require('./int'),
    Link: require('./link'),
    Password: require('./password'),
    Select: require('./select'),
    Table: require('./table'),
    Text: require('./text')
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