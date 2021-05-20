import { useQuery, QueryConfig } from 'react-query';
import snxData from 'synthetix-data';

import QUERY_KEYS from 'constants/queryKeys';
import { CurrencyKey, SYNTHS_MAP } from 'constants/currency';
import { PERIOD_IN_HOURS, Period } from 'constants/period';

import { calculateTimestampForPeriod } from './utils';

const useLatestSynthRateQuery = (
	currencyKey: CurrencyKey | null,
	period: Period = Period.ONE_DAY,
	options?: QueryConfig<number>
) => {
	const periodInHours = PERIOD_IN_HOURS[period];

	return useQuery<number>(
		QUERY_KEYS.Rates.LatestSynthRate(currencyKey as string, period),
		async () => {
			if (currencyKey === SYNTHS_MAP.sUSD) {
				return 1;
			} else {
				const rates = await snxData.rate.updates({
					synth: currencyKey,
					maxTimestamp: calculateTimestampForPeriod(periodInHours),
					max: 1,
				});
				return rates[0]?.rate ?? 1;
			}
		},
		{
			enabled: currencyKey,
			...options,
		}
	);
};

export default useLatestSynthRateQuery;
