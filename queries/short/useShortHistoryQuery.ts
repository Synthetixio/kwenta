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
import { calculateInterestAndProfitLoss } from 'sections/shorting/utils';
import synthetix from 'lib/synthetix';

import { Short, InterestRateHistory } from './types';
import { shortsQuery, ratesAtBlockQuery } from './query';
import { mockShorts } from './mockShorts';
import { formatShort, SHORT_GRAPH_ENDPOINT } from './utils';
import useShortContractDataQuery from './useShortContractDataQuery';

const useShortHistoryQuery = (options?: QueryConfig<Short[]>) => {
	const isAppReady = useRecoilValue(appReadyState);
	const isWalletConnected = useRecoilValue(isWalletConnectedState);
	const walletAddress = useRecoilValue(walletAddressState);
	const { selectedPriceCurrency } = useSelectedPriceCurrency();
	const exchangeRatesQuery = useExchangeRatesQuery();
	const shortContractDataQuery = useShortContractDataQuery();
	const exchangeRates = exchangeRatesQuery.isSuccess ? exchangeRatesQuery.data ?? null : null;
	const shortContractData = shortContractDataQuery.isSuccess
		? shortContractDataQuery.data ?? null
		: null;

	const interestRateHistory: InterestRateHistory[] = (shortContractData?.contractUpdates ?? [])
		.filter(({ field }) => field === 'issueFeeRate')
		.map(({ timestamp, value }) => ({ rate: value, timestamp }));

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
										async ({ loanAfter, timestamp, amount, isRepayment, blockNumber }) => {
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
												loanAfter,
												timestamp,
												amount,
												isRepayment,
												rate,
											};
										}
									)
								);

								const { interestAccrued, profitLoss } = calculateInterestAndProfitLoss({
									accruedInterestAsOfLastUpdate: toBigNumber(
										ethers.utils.formatEther(loan.accruedInterest)
									),
									accruedInterestLastUpdateTimestamp: (formattedShort as Short)
										.accruedInterestLastUpdateTimestamp,
									interestRateHistory,
									currentSynthPrice: new BigNumber(synthBorrowedPrice),
									synthBorrowedAmount: (formattedShort as Short).synthBorrowedAmount,
									synthBorrowedHistory,
								});

								return {
									...formattedShort,
									interestAccrued,
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
