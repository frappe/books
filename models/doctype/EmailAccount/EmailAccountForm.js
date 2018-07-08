const BaseForm = require('frappejs/client/view/form');
const frappe = require('frappejs');
const getConfig = require("../../../email/getConfig");


module.exports = class EmailAccountForm extends BaseForm {
    constructor({ doctype, parent, submit_label='', container, meta, inline=false }) {
        super({ doctype: 'EmailAccount', parent: parent, container: container, meta: meta });
        this.makeSaveButton();
    }

    makeSaveButton() {
       
        this.saveButton = this.container.addButton(frappe._("Save"), 'primary', async (event) => {
            let account = await getConfig();
            
            var response = await frappe.call({
                method: 'validate-mail',
                args: this.doc.getValidDict()
            });
            if(response == true){
                await this.save();
                /*
                let x = await frappe.call({
                    method: 'validate-auth',
                    args: userInput 
                });
                x().then(async function(){
                    console.log("HEY SAVE");
                    
                }).catch(function(){
                    console.log("HEY ERROR");
                    frappe.ui.showAlert({message: frappe._('Failed : Invalid Details'), color: 'red'});
                });
                */
            }
            else{
                frappe.ui.showAlert({message: frappe._('Failed : Invalid Email'), color: 'red'});
            }
            if(account[0].password === account[0].confirmPassword) {
                       console.log('haha');
            }
            else
            { frappe.ui.showAlert({message: frappe._('Error : Passwords do not match'), color: 'red'}); } 
    });
        this.on('change', () => {
            const show = this.doc._dirty && !this.doc.submitted;
            this.saveButton.classList.toggle('hide', !show);
        });
     }
};
