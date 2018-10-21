module.exports = {
	name: "Warehouse",
	doctype: "DocType",
	isTree: 1,
	fields: [
		{
			fieldname:"name",
			label: "Warehouse Name",
			fieldtype: "Data"
		},
		{
            fieldname: "parentWarehouse",
            label: "Parent Warehouse",
            fieldtype: "Link",
			target: "Warehouse",
			getFilters: (query, control) => {
				return {
					keywords: ["like", query],
					isGroup: 1
				}
			}

        },
        {
            fieldname: "isGroup",
            label: "Is Group",
            fieldtype: "Check"
        },

	],
	keywordFields: ["name", "parentWarehouse"],
	isSingle: 0,
	listSettings: {
		getFields(list) {
			return ["name", "parentWarehouse", "isGroup"];
		},
		getRowHTML(list, data) {
			var details;
			if (data.isGroup && data.parentWarehouse) {
				details = `
					<div class='row'>
						<div class="col-3">${data.name} </div>
						<div class="col-3">type = group</div>
						<div class="col-5">hasParent ➤ ${data.parentWarehouse}</div>
					</div>
				`;
			}else if(data.isGroup) {
				details = `
				<div class='row'>
					<div class="col-3">${data.name} </div>
					<div class="col-3">type = group</div>
					<div class="col-5">noParent</div>
				</div>
				`;
			}else {
				details = `
				<div class='row'>
					<div class="col-3 ">${data.name} </div>
					<div class="col-3">type = child</div>
					<div class="col-5">hasParent ➤ ${data.parentWarehouse}</div>
				</div>
				`;
			}
			return `<div class="col-11">${details}</div>`;
		}
	},
	layout: [
        // section 1
        {
            columns: [
                { fields: [ "name", "parentWarehouse", "isGroup" ] }
            ]
        }

    ]
}
