module.exports = {
    validate: async function (mailDetails) {
        var reg = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;
        if (reg.test(mailDetails.email) == false) {
            return false;
        }
        return true;
    },
    // incomplete
    authValidate: async function (mailDetails) {
        var reg = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;
        if (reg.test(mailDetails.email) == false) {
            return false;
        }
        return true;
    }
}