import { useQuery, BaseQueryOptions } from 'react-query';
import snxData from 'synthetix-data';

import QUERY_KEYS from 'constants/queryKeys';
import { CurrencyKey, SYNTHS_MAP, sUSD_EXCHANGE_RATE } from 'constants/currency';
import { PERIOD_IN_HOURS, Period } from 'constants/period';

import {
	calculateTimestampForPeriod,
	getMinAndMaxRate,
	calculateRateChange,
	mockHistoricalRates,
} from './utils';
import { HistoricalRatesUpdates, RateUpdates } from './types';
import { Synth, Synths } from 'lib/synthetix';

const useHistoricalRatesQuery = (
	currencyKey: CurrencyKey | null,
	period: Period = Period.ONE_DAY,
	options?: BaseQueryOptions
) => {
	const periodInHours = PERIOD_IN_HOURS[period];

	return useQuery<HistoricalRatesUpdates, any>(
		QUERY_KEYS.Rates.HistoricalRates(currencyKey as string, period),
		async () => {
			if (currencyKey === SYNTHS_MAP.sUSD) {
				return {
					rates: mockHistoricalRates(periodInHours, sUSD_EXCHANGE_RATE),
					low: sUSD_EXCHANGE_RATE,
					high: sUSD_EXCHANGE_RATE,
					change: 0,
				};
			}
			const rates = await snxDataRateUpdates(currencyKey!, period);

			const [low, high] = getMinAndMaxRate(rates);
			const change = calculateRateChange(rates);

			return {
				rates: rates.reverse(),
				low,
				high,
				change,
			};
		},
		{
			enabled: currencyKey,
			...options,
		}
	);
};

const snxDataRateUpdates = async (currencyKey: string, period: Period) =>
	snxData.rate.updates({
		synth: currencyKey,
		// maxTimestamp: Math.trunc(now / 1000),
		minTimestamp: calculateTimestampForPeriod(PERIOD_IN_HOURS[period]),
		max: 6000,
	});

export const getHistoricalRateUpdate = (rates: RateUpdates) => {
	const [low, high] = getMinAndMaxRate(rates);
	const change = calculateRateChange(rates);

	return {
		rates: rates.reverse(),
		low,
		high,
		change,
	};
};

export interface HistoricalRatesBySynth {
	[key: string]: HistoricalRatesUpdates;
}

export const useHistoricalRatesListQuery = (
	synths: Synths,
	period: Period,
	options?: BaseQueryOptions
) =>
	useQuery<HistoricalRatesBySynth, any>(
		QUERY_KEYS.Rates.TrendingSynthsVolume,
		() =>
			Promise.all(
				synths.map((synth: Synth) =>
					snxDataRateUpdates(synth.name, period).then((response) => ({
						name: synth.name,
						rates: getHistoricalRateUpdate(response),
					}))
				)
			).then((responses) =>
				responses.reduce(
					(arr, cur: any) => ({
						...arr,
						[cur.name]: cur.rates,
					}),
					{}
				)
			),
		options
	);

export default useHistoricalRatesQuery;
