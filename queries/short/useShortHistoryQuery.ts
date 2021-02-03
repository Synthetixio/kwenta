import { useQuery, QueryConfig } from 'react-query';
import { useRecoilValue } from 'recoil';
import { request } from 'graphql-request';

import { appReadyState } from 'store/app';
import { walletAddressState, isWalletConnectedState } from 'store/wallet';
import QUERY_KEYS from 'constants/queryKeys';
import useSelectedPriceCurrency from 'hooks/useSelectedPriceCurrency';
import useExchangeRatesQuery from 'queries/rates/useExchangeRatesQuery';
import { getExchangeRatesForCurrencies } from 'utils/currencies';

import { Short } from './types';
import { query } from './query';

const SHORT_GRAPH_ENDPOINT = 'https://api.thegraph.com//subgraphs/name/dvd-schwrtz/test';

const useShortHistoryQuery = (options?: QueryConfig<Short[]>) => {
	const isAppReady = useRecoilValue(appReadyState);
	const isWalletConnected = useRecoilValue(isWalletConnectedState);
	const walletAddress = useRecoilValue(walletAddressState);
	const { selectedPriceCurrency } = useSelectedPriceCurrency();
	const exchangeRatesQuery = useExchangeRatesQuery();
	const exchangeRates = exchangeRatesQuery.isSuccess ? exchangeRatesQuery.data ?? null : null;

	return useQuery<Short[]>(
		QUERY_KEYS.Collateral.ShortHistory(walletAddress ?? ''),
		async () => {
			const unformattedShortsList = await request(SHORT_GRAPH_ENDPOINT, query, {
				account: walletAddress,
			});
			console.log('unformattedShortsList', unformattedShortsList);
			return unformattedShortsList.map((short: Partial<Short>) => ({
				...short,
				synthBorrowedPrice: getExchangeRatesForCurrencies(
					exchangeRates,
					short.synthBorrowed as string,
					selectedPriceCurrency.name
				) as number,
				collateralLockedPrice: getExchangeRatesForCurrencies(
					exchangeRates,
					short.collateralLocked as string,
					selectedPriceCurrency.name
				) as number,
			}));
		},
		{
			enabled: isAppReady && isWalletConnected,
			...options,
		}
	);
};

export default useShortHistoryQuery;
