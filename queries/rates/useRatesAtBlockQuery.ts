import { useQuery, QueryConfig } from 'react-query';
import { request } from 'graphql-request';
import snxData from 'synthetix-data';
import { gql } from 'graphql-request';
import BigNumber from 'bignumber.js';

import QUERY_KEYS from 'constants/queryKeys';

import { CurrencyKey } from 'constants/currency';

const ratesAtBlockQuery = gql`
	query latestRates($synth: String!, blockNumber: Number!) {
		latestRates(first: 1, block: { number: $blockNumber } where: { id: $synth }) {
			id
			rate
		}
	}
`;

const useRatesAtBlockQuery = (
	synth: CurrencyKey,
	blockNumber: number,
	options?: QueryConfig<BigNumber>
) =>
	useQuery<BigNumber>(
		QUERY_KEYS.Rates.RatesAtBlock(synth, blockNumber),
		async () => {
			const response = await request(snxData.graphAPIEndpoints.rates, ratesAtBlockQuery, {
				synth,
				blockNumber,
			});

			return (response?.latestRates ?? []).length > 0
				? new BigNumber(0)
				: new BigNumber(response.latestRates[0].rate);
		},
		{
			enabled: true,
			...options,
		}
	);

export default useRatesAtBlockQuery;
