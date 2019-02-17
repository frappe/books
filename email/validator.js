// + Check Confirm Password == Password

module.exports = {
    validate: function (email) {
        var reg = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;
        if (reg.test(email) == false) {
            return false;
        }
        return true;
    }
}