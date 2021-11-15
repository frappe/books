import { DateTime } from 'luxon';

export async function getExchangeRate({ fromCurrency, toCurrency, date }) {
  if (!date) {
    date = DateTime.local().toISODate();
  }
  if (!fromCurrency || !toCurrency) {
    throw new Error(
      'Please provide `fromCurrency` and `toCurrency` to get exchange rate.'
    );
  }
  let cacheKey = `currencyExchangeRate:${date}:${fromCurrency}:${toCurrency}`;
  let exchangeRate = parseFloat(localStorage.getItem(cacheKey));
  if (!exchangeRate) {
    try {
      let res = await fetch(
        `https://api.vatcomply.com/${date}?base=${fromCurrency}&symbols=${toCurrency}`
      );
      let data = await res.json();
      exchangeRate = data.rates[toCurrency];
      localStorage.setItem(cacheKey, exchangeRate);
    } catch (error) {
      console.error(error);
      throw new Error(
        `Could not fetch exchange rate for ${fromCurrency} -> ${toCurrency}`
      );
    }
  }
  return exchangeRate;
}
