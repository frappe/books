const number_formats = {
	"#,###.##": { fraction_sep: ".", group_sep: ",", precision: 2 },
	"#.###,##": { fraction_sep: ",", group_sep: ".", precision: 2 },
	"# ###.##": { fraction_sep: ".", group_sep: " ", precision: 2 },
	"# ###,##": { fraction_sep: ",", group_sep: " ", precision: 2 },
	"#'###.##": { fraction_sep: ".", group_sep: "'", precision: 2 },
	"#, ###.##": { fraction_sep: ".", group_sep: ", ", precision: 2 },
	"#,##,###.##": { fraction_sep: ".", group_sep: ",", precision: 2 },
	"#,###.###": { fraction_sep: ".", group_sep: ",", precision: 3 },
	"#.###": { fraction_sep: "", group_sep: ".", precision: 0 },
	"#,###": { fraction_sep: "", group_sep: ",", precision: 0 },
}

module.exports = {
	// parse a formatted number string
	// from "4,555,000.34" -> 4555000.34
	parse_number(number, format='#,###.##') {
		if (!number) {
			return 0;
		}
		if (typeof number === 'number') {
			return number;
		}
		const info = this.get_format_info(format);
		return parseFloat(this.remove_separator(number, info.group_sep));
	},

	format_number(number, format = '#,###.##', precision = null) {
		if (!number) {
			number = 0;
		}
		let info = this.get_format_info(format);
		if (precision) {
			info.precision = precision;
		}
		let is_negative = false;

		number = this.parse_number(number);
		if (number < 0) {
			is_negative = true;
		}
		number = Math.abs(number);
		number = number.toFixed(info.precision);

		var parts = number.split('.');

		// get group position and parts
		var group_position = info.group_sep ? 3 : 0;

		if (group_position) {
			var integer = parts[0];
			var str = '';
			var offset = integer.length % group_position;
			for (var i = integer.length; i >= 0; i--) {
				var l = this.remove_separator(str, info.group_sep).length;
				if (format == "#,##,###.##" && str.indexOf(",") != -1) { // INR
					group_position = 2;
					l += 1;
				}

				str += integer.charAt(i);

				if (l && !((l + 1) % group_position) && i != 0) {
					str += info.group_sep;
				}
			}
			parts[0] = str.split("").reverse().join("");
		}
		if (parts[0] + "" == "") {
			parts[0] = "0";
		}

		// join decimal
		parts[1] = (parts[1] && info.fraction_sep) ? (info.fraction_sep + parts[1]) : "";

		// join
		return (is_negative ? "-" : "") + parts[0] + parts[1];
	},

	get_format_info(format) {
		let format_info = number_formats[format];

		if (!format_info) {
			throw `Unknown number format "${format}"`;
		}

		return format_info;
	},

	round(num, precision) {
        var is_negative = num < 0 ? true : false;
        var d = parseInt(precision || 0);
        var m = Math.pow(10, d);
        var n = +(d ? Math.abs(num) * m : Math.abs(num)).toFixed(8); // Avoid rounding errors
        var i = Math.floor(n), f = n - i;
        var r = ((!precision && f == 0.5) ? ((i % 2 == 0) ? i : i + 1) : Math.round(n));
        r = d ? r / m : r;
        return is_negative ? -r : r;
	},

	remove_separator(text, sep) {
		return text.replace(new RegExp(sep === "." ? "\\." : sep, "g"), '');
	}
};
