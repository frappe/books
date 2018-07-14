const numberFormat = require('frappejs/utils/numberFormat');
const assert = require('assert');

describe('Number Formatting', () => {
    it('should format numbers', () => {
        assert.equal(numberFormat.formatNumber(100), '100.00');
        assert.equal(numberFormat.formatNumber(1000), '1,000.00');
        assert.equal(numberFormat.formatNumber(10000), '10,000.00');
        assert.equal(numberFormat.formatNumber(100000), '100,000.00');
        assert.equal(numberFormat.formatNumber(1000000), '1,000,000.00');
        assert.equal(numberFormat.formatNumber(100.1234), '100.12');
        assert.equal(numberFormat.formatNumber(1000.1234), '1,000.12');
    });

    it('should parse numbers', () => {
        assert.equal(numberFormat.parseNumber('100.00'), 100);
        assert.equal(numberFormat.parseNumber('1,000.00'), 1000);
        assert.equal(numberFormat.parseNumber('10,000.00'), 10000);
        assert.equal(numberFormat.parseNumber('100,000.00'), 100000);
        assert.equal(numberFormat.parseNumber('1,000,000.00'), 1000000);
        assert.equal(numberFormat.parseNumber('100.1234'), 100.1234);
        assert.equal(numberFormat.parseNumber('1,000.1234'), 1000.1234);
    });

    it('should format lakhs and crores', () => {
        assert.equal(numberFormat.formatNumber(100, '#,##,###.##'), '100.00');
        assert.equal(numberFormat.formatNumber(1000, '#,##,###.##'), '1,000.00');
        assert.equal(numberFormat.formatNumber(10000, '#,##,###.##'), '10,000.00');
        assert.equal(numberFormat.formatNumber(100000, '#,##,###.##'), '1,00,000.00');
        assert.equal(numberFormat.formatNumber(1000000, '#,##,###.##'), '10,00,000.00');
        assert.equal(numberFormat.formatNumber(10000000, '#,##,###.##'), '1,00,00,000.00');
        assert.equal(numberFormat.formatNumber(100.1234, '#,##,###.##'), '100.12');
        assert.equal(numberFormat.formatNumber(1000.1234, '#,##,###.##'), '1,000.12');
    });
});