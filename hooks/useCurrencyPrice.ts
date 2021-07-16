import { useRecoilValue } from 'recoil';

import { CurrencyKey } from 'constants/currency';
import useExchangeRatesQuery from 'queries/rates/useExchangeRatesQuery';
import { priceCurrencyState } from 'store/app';
import { toBigNumber } from 'utils/formatters/number';

const useCurrencyPrice = (currencyKey: CurrencyKey) => {
	const selectedPriceCurrency = useRecoilValue(priceCurrencyState);
	const exchangeRatesQuery = useExchangeRatesQuery();
	const exchangeRates = exchangeRatesQuery.isSuccess ? exchangeRatesQuery.data ?? null : null;
	const selectPriceCurrencyRate = exchangeRates && exchangeRates[selectedPriceCurrency.name];
	const currencyUSDPrice = exchangeRates && exchangeRates[currencyKey];
	return !(currencyUSDPrice && selectPriceCurrencyRate)
		? toBigNumber(0)
		: toBigNumber(currencyUSDPrice).dividedBy(selectPriceCurrencyRate);
};

export default useCurrencyPrice;
