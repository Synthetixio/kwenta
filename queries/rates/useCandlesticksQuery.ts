import { Period, PERIOD_IN_HOURS } from 'constants/period';
import QUERY_KEYS from 'constants/queryKeys';
import request, { gql } from 'graphql-request';
import { QueryConfig, useQuery } from 'react-query';
import { Candle } from './types';
import { calculateTimestampForPeriod } from './utils';

const ENDPOINT = 'https://api.thegraph.com/subgraphs/name/jchiaramonte7/testcandlesticks';

const useCandlesticksQuery = (
	currencyKey: string | null,
	period: Period = Period.ONE_DAY,
	options?: QueryConfig<Array<Candle>>
) => {
	const periodInHours = PERIOD_IN_HOURS[period];

	// TODO: move to data library in js monorepo once L2 branch is merged
	return useQuery<Array<Candle>>(
		QUERY_KEYS.Rates.Candlesticks(currencyKey as string, period),
		async () => {
			const candleGranularity = period === Period.ONE_WEEK ? 'fourHourly' : 'daily';
			const response = (await request(
				ENDPOINT,
				gql`
					query ${candleGranularity}Candles($synth: String!, $minTimestamp: BigInt!) {
						${candleGranularity}Candles(
							where: { synth: $synth, timestamp_gt: $minTimestamp }
							orderBy: id
							orderDirection: desc
						) {
							id
							synth
							open
							high
							low
							close
							timestamp
						}
					}
				`,
				{
					synth: currencyKey,
					minTimestamp: calculateTimestampForPeriod(periodInHours),
				}
			)) as {
				[key: string]: Array<Candle>;
			};
			return response[`${candleGranularity}Candles`].reverse();
		},
		{
			enabled: currencyKey && period,
			...options,
		}
	);
};

export default useCandlesticksQuery;
