const { pesa } = require('pesa');
const { T, t } = require('./translation');

Array.prototype.equals = function (array) {
  return (
    this.length == array.length &&
    this.every(function (item, i) {
      return item == array[i];
    })
  );
};

function slug(str) {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, function (letter, index) {
      return index == 0 ? letter.toLowerCase() : letter.toUpperCase();
    })
    .replace(/\s+/g, '');
}

function getRandomString() {
  return Math.random().toString(36).substr(3);
}

async function sleep(seconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, seconds * 1000);
  });
}

function getQueryString(params) {
  if (!params) return '';
  let parts = [];
  for (let key in params) {
    if (key != null && params[key] != null) {
      parts.push(
        encodeURIComponent(key) + '=' + encodeURIComponent(params[key])
      );
    }
  }
  return parts.join('&');
}

function asyncHandler(fn) {
  return (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch((err) => {
      console.log(err);
      // handle error
      res.status(err.statusCode || 500).send({ error: err.message });
    });
}

/**
 * Returns array from 0 to n - 1
 * @param {Number} n
 */
function range(n) {
  return Array(n)
    .fill()
    .map((_, i) => i);
}

function unique(list, key = (it) => it) {
  var seen = {};
  return list.filter((item) => {
    var k = key(item);
    return seen.hasOwnProperty(k) ? false : (seen[k] = true);
  });
}

function getDuplicates(array) {
  let duplicates = [];
  for (let i in array) {
    let previous = array[i - 1];
    let current = array[i];

    if (current === previous) {
      if (!duplicates.includes(current)) {
        duplicates.push(current);
      }
    }
  }
  return duplicates;
}

function isPesa(value) {
  return value instanceof pesa().constructor;
}

module.exports = {
  _: t,
  t,
  T,
  slug,
  getRandomString,
  sleep,
  getQueryString,
  asyncHandler,
  range,
  unique,
  getDuplicates,
  isPesa,
};
