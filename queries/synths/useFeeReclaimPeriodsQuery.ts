import { useQuery, UseQueryOptions } from 'react-query';
import { ethers } from 'ethers';
import { useRecoilValue } from 'recoil';

import QUERY_KEYS from 'constants/queryKeys';
import Connector from 'containers/Connector';
import { CurrencyKey, Synth } from '@synthetixio/contracts-interface';
import { isWalletConnectedState, walletAddressState } from 'store/wallet';
import { appReadyState } from 'store/app';
import { SynthFeeAndWaitingPeriod } from 'queries/trades/types';
import { wei } from '@synthetixio/wei';

const useFeeReclaimPeriodsQuery = (options?: UseQueryOptions<SynthFeeAndWaitingPeriod[]>) => {
	const isAppReady = useRecoilValue(appReadyState);
	const isWalletConnected = useRecoilValue(isWalletConnectedState);
	const walletAddress = useRecoilValue(walletAddressState);
	const { synthetixjs } = Connector.useContainer();

	return useQuery<SynthFeeAndWaitingPeriod[]>(
		QUERY_KEYS.Synths.FeeReclaimPeriods(),
		async () => {
			if (!synthetixjs) return [];

			const {
				synths,
				contracts: { Exchanger },
			} = synthetixjs;

			const loadWaitingPeriod = async (currencyKey: Synth) => {
				const maxSecsLeftInWaitingPeriod = (await Exchanger.maxSecsLeftInWaitingPeriod(
					walletAddress,
					ethers.utils.formatBytes32String(currencyKey.name)
				)) as ethers.BigNumberish;

				return Number(maxSecsLeftInWaitingPeriod);
			};

			const loadFee = async (currencyKey: Synth) => {
				const [rebate, reclaim, noOfTrades] = await Exchanger.settlementOwing(
					walletAddress,
					ethers.utils.formatBytes32String(currencyKey.name)
				);
				return {
					fee: wei(ethers.utils.formatEther(rebate.sub(reclaim))),
					noOfTrades: Number(noOfTrades.toString()),
				};
			};

			const waitingPeriods = await Promise.all(synths.map(loadWaitingPeriod));
			const fees = await Promise.all(synths.map(loadFee));
			return synths.map((currencyKey, i) => {
				const { fee, noOfTrades } = fees[i];
				return {
					currencyKey: currencyKey.name as CurrencyKey,
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
