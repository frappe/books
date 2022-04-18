import { NotFoundError } from 'frappe/utils/errors';
import { DateTime } from 'luxon';

export async function getExchangeRate({
  fromCurrency,
  toCurrency,
  date,
}: {
  fromCurrency: string;
  toCurrency: string;
  date?: string;
}) {
  if (!date) {
    date = DateTime.local().toISODate();
  }

  if (!fromCurrency || !toCurrency) {
    throw new NotFoundError(
      'Please provide `fromCurrency` and `toCurrency` to get exchange rate.'
    );
  }

  const cacheKey = `currencyExchangeRate:${date}:${fromCurrency}:${toCurrency}`;

  let exchangeRate = 0;
  if (localStorage) {
    exchangeRate = parseFloat(
      localStorage.getItem(cacheKey as string) as string
    );
  }

  if (!exchangeRate) {
    try {
      const res = await fetch(
        ` https://api.vatcomply.com/rates?date=${date}&base=${fromCurrency}&symbols=${toCurrency}`
      );
      const data = await res.json();
      exchangeRate = data.rates[toCurrency];

      if (localStorage) {
        localStorage.setItem(cacheKey, String(exchangeRate));
      }
    } catch (error) {
      console.error(error);
      throw new Error(
        `Could not fetch exchange rate for ${fromCurrency} -> ${toCurrency}`
      );
    }
  }

  return exchangeRate;
}
