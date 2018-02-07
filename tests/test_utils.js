const number_format = require('frappejs/utils/number_format');
const assert = require('assert');

describe('Number Formatting', () => {
	it('should format numbers', () => {
		assert.equal(number_format.format_number(100), '100.00');
		assert.equal(number_format.format_number(1000), '1,000.00');
		assert.equal(number_format.format_number(10000), '10,000.00');
		assert.equal(number_format.format_number(100000), '100,000.00');
		assert.equal(number_format.format_number(1000000), '1,000,000.00');
		assert.equal(number_format.format_number(100.1234), '100.12');
		assert.equal(number_format.format_number(1000.1234), '1,000.12');
	});

	it('should parse numbers', () => {
		assert.equal(number_format.parse_number('100.00'), 100);
		assert.equal(number_format.parse_number('1,000.00'), 1000);
		assert.equal(number_format.parse_number('10,000.00'), 10000);
		assert.equal(number_format.parse_number('100,000.00'), 100000);
		assert.equal(number_format.parse_number('1,000,000.00'), 1000000);
		assert.equal(number_format.parse_number('100.1234'), 100.1234);
		assert.equal(number_format.parse_number('1,000.1234'), 1000.1234);
	});

	it('should format lakhs and crores', () => {
		assert.equal(number_format.format_number(100, '#,##,###.##'), '100.00');
		assert.equal(number_format.format_number(1000, '#,##,###.##'), '1,000.00');
		assert.equal(number_format.format_number(10000, '#,##,###.##'), '10,000.00');
		assert.equal(number_format.format_number(100000, '#,##,###.##'), '1,00,000.00');
		assert.equal(number_format.format_number(1000000, '#,##,###.##'), '10,00,000.00');
		assert.equal(number_format.format_number(10000000, '#,##,###.##'), '1,00,00,000.00');
		assert.equal(number_format.format_number(100.1234, '#,##,###.##'), '100.12');
		assert.equal(number_format.format_number(1000.1234, '#,##,###.##'), '1,000.12');
	});
});