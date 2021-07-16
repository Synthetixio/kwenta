import { useQuery, QueryConfig } from 'react-query';
import { ethers } from 'ethers';
import { useRecoilValue } from 'recoil';

import QUERY_KEYS from 'constants/queryKeys';
import { CurrencyKey, SYNTHS } from 'constants/currency';

import synthetix from 'lib/synthetix';

import { isWalletConnectedState, walletAddressState } from 'store/wallet';
import { appReadyState } from 'store/app';
import { SynthFeeAndWaitingPeriod } from 'queries/trades/types';
import { toBigNumber } from 'utils/formatters/number';

const useFeeReclaimPeriodsQuery = (options?: QueryConfig<SynthFeeAndWaitingPeriod[]>) => {
	const isAppReady = useRecoilValue(appReadyState);
	const isWalletConnected = useRecoilValue(isWalletConnectedState);
	const walletAddress = useRecoilValue(walletAddressState);

	return useQuery<SynthFeeAndWaitingPeriod[]>(
		QUERY_KEYS.Synths.FeeReclaimPeriods(),
		async () => {
			const loadWaitingPeriod = async (currencyKey: CurrencyKey) => {
				const maxSecsLeftInWaitingPeriod = (await synthetix.js?.contracts.Exchanger.maxSecsLeftInWaitingPeriod(
					walletAddress,
					ethers.utils.formatBytes32String(currencyKey!)
				)) as ethers.BigNumberish;

				return Number(maxSecsLeftInWaitingPeriod);
			};

			const loadFee = async (currencyKey: CurrencyKey) => {
				const [
					rebate,
					reclaim,
					noOfTrades,
				] = await synthetix.js?.contracts.Exchanger.settlementOwing(
					walletAddress,
					ethers.utils.formatBytes32String(currencyKey)
				);
				return {
					fee: toBigNumber(rebate.sub(reclaim).toString()).div(1e18),
					noOfTrades: Number(noOfTrades.toString()),
				};
			};

			const waitingPeriods = await Promise.all(SYNTHS.map(loadWaitingPeriod));
			const fees = await Promise.all(SYNTHS.map(loadFee));
			return SYNTHS.map((currencyKey, i) => {
				const { fee, noOfTrades } = fees[i];
				return {
					currencyKey,
					waitingPeriod: waitingPeriods[i],
					fee,
					noOfTrades,
				};
			});
		},
		{
			enabled: isAppReady && isWalletConnected,
			...options,
		}
	);
};

export default useFeeReclaimPeriodsQuery;
