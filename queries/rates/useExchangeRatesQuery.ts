import { useQuery, QueryConfig } from 'react-query';
import { ethers } from 'ethers';

import synthetix from 'lib/synthetix';

import QUERY_KEYS from 'constants/queryKeys';
import { CurrencyKey } from 'constants/currency';
import { DEFAULT_REQUEST_REFRESH_INTERVAL } from 'constants/defaults';

export type Rates = Record<CurrencyKey, number>;

const useExchangeRatesQuery = (options?: QueryConfig<Rates>) => {
	return useQuery<Rates>(
		QUERY_KEYS.Rates.ExchangeRates,
		async () => {
			const exchangeRates: Rates = {};

			const [synths, rates] = await synthetix.synthSummaryUtil!.synthsRates();

			synths.forEach((synth: CurrencyKey, idx: number) => {
				const synthName = ethers.utils.parseBytes32String(synth) as CurrencyKey;
				exchangeRates[synthName] = Number(ethers.utils.formatEther(rates[idx]));
			});

			return exchangeRates;
		},
		{
			enabled: synthetix.synthSummaryUtil,
			refetchInterval: DEFAULT_REQUEST_REFRESH_INTERVAL,
			...options,
		}
	);
};

export default useExchangeRatesQuery;
