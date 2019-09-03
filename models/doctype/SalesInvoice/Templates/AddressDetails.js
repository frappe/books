async function getCompanyDetails() {
    let companyDetails = {
        name: null,
        address: {}
    };

    let companySettings = await frappe.getDoc('CompanySettings');
    companyDetails.name = companySettings.companyName;

    let companyAddress = await getAddress(companySettings.companyAddress);
    companyDetails.address = companyAddress;
    return companyDetails;
}

async function getCustomerAddress(customer) {
    let customers = await frappe.db.getAll({ doctype: 'Party', fields:['name, address'], filters: { name: customer }});
    let customerDetails = await frappe.getDoc('Party', customers[0].name);
    return await getAddress(customerDetails.address);
}

async function getAddress(addressName) {
    return await frappe.getDoc('Address', addressName);
}

module.exports = {
    getCompanyDetails,
    getCustomerAddress
}