const controlClasses = {
    Check: require('./check'),
    Code: require('./code'),
    Data: require('./data'),
    Date: require('./date'),
    DynamicLink: require('./dynamicLink'),
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
        return controlClasses[fieldtype];
    },
    makeControl({field, form, parent}) {
        const controlClass = this.getControlClass(field.fieldtype);
        let control = new controlClass({field:field, form:form, parent:parent});
        return control;
    }
}