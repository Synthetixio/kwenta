import { useQuery, QueryConfig } from 'react-query';
import { useRecoilValue } from 'recoil';
import { request } from 'graphql-request';
import BigNumber from 'bignumber.js';
import snxData from 'synthetix-data';
import { ethers } from 'ethers';

import { toBigNumber } from 'utils/formatters/number';
import { appReadyState } from 'store/app';
import { walletAddressState, isWalletConnectedState } from 'store/wallet';
import QUERY_KEYS from 'constants/queryKeys';
import useSelectedPriceCurrency from 'hooks/useSelectedPriceCurrency';
import useExchangeRatesQuery from 'queries/rates/useExchangeRatesQuery';
import { getExchangeRatesForCurrencies } from 'utils/currencies';
import { calculateAccuredInterest, calculateProfitAndLoss } from 'sections/shorting/utils';
import synthetix from 'lib/synthetix';

import { Short } from './types';
import { shortsQuery, ratesAtBlockQuery } from './query';
import { mockShorts } from './mockShorts';
import { formatShort, SHORT_GRAPH_ENDPOINT } from './utils';

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
			if (walletAddress != null) {
				const response = await request(SHORT_GRAPH_ENDPOINT, shortsQuery, {
					account: walletAddress,
				});

				return Promise.all(
					(response?.shorts ?? []).length > 0
						? response.shorts.map(async (shortResponseItem: Partial<Short>) => {
								const loan = await synthetix.js!.contracts.CollateralState.getLoan(
									walletAddress,
									shortResponseItem.id
								);
								const formattedShort = formatShort(shortResponseItem);
								const synthBorrowedPrice = getExchangeRatesForCurrencies(
									exchangeRates,
									formattedShort.synthBorrowed as string,
									selectedPriceCurrency.name
								) as number;

								const synthBorrowedHistory = await Promise.all(
									(formattedShort.loanChanges ?? []).map(
										async ({ amount, isRepayment, blockNumber }) => {
											const rateAtBlockResponse = await request(
												snxData.graphAPIEndpoints.rates,
												ratesAtBlockQuery,
												{
													synth: formattedShort.synthBorrowed as string,
													blockNumber,
												}
											);

											const rate =
												(rateAtBlockResponse?.latestRates ?? []).length > 0
													? new BigNumber(0)
													: new BigNumber(rateAtBlockResponse.latestRates[0].rate);
											return {
												amount,
												isRepayment,
												rate,
											};
										}
									)
								);

								const profitLoss = calculateProfitAndLoss({
									currentSynthPrice: new BigNumber(synthBorrowedPrice),
									synthBorrowedAmount: (formattedShort as Short).synthBorrowedAmount,
									synthBorrowedHistory,
								});
								return {
									...formattedShort,
									interestAccrued: calculateAccuredInterest({
										currentBorrowSize: (formattedShort as Short).synthBorrowedAmount,
										accruedInterestAsOfLastUpdate: toBigNumber(
											ethers.utils.formatEther(loan.accruedInterest)
										),
										shortRate: new BigNumber(0),
										accruedInterestLastUpdateTimestamp: (formattedShort as Short)
											.accruedInterestLastUpdateTimestamp,
									}),
									profitLoss,
									synthBorrowedPrice,
									collateralLockedPrice: getExchangeRatesForCurrencies(
										exchangeRates,
										formattedShort.collateralLocked as string,
										selectedPriceCurrency.name
									) as number,
								};
						  })
						: mockShorts.map((short) => ({
								...formatShort(short),
								collateralLockedPrice: short.collateralLockedPrice,
								synthBorrowedPrice: short.synthBorrowedPrice,
								interestAccrued: new BigNumber(Math.random()),
						  }))
				);
			} else {
				return [];
			}
		},
		{
			enabled: isAppReady && isWalletConnected,
			...options,
		}
	);
};

export default useShortHistoryQuery;
