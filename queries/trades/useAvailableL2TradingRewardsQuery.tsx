import { QueryConfig, useQuery } from 'react-query';
import synthetix from 'lib/synthetix';

import QUERY_KEYS from 'constants/queryKeys';
import { useRecoilValue } from 'recoil';
import { isWalletConnectedState, networkState, walletAddressState } from 'store/wallet';
import { appReadyState } from 'store/app';
import BigNumber from 'bignumber.js';
import { toBigNumber } from 'utils/formatters/number';

type Ret = BigNumber;

const useAvailableL2TradingRewardsQuery = (options?: QueryConfig<Ret>) => {
	const isAppReady = useRecoilValue(appReadyState);
	const isWalletConnected = useRecoilValue(isWalletConnectedState);
	const walletAddress = useRecoilValue(walletAddressState);
	const network = useRecoilValue(networkState);

	return useQuery<Ret>(
		QUERY_KEYS.Trades.AvailableL2TradingRewards(walletAddress ?? '', network?.id!),
		async () => {
			const {
				contracts: { TradingRewards },
				utils,
			} = synthetix.js!;
			const currentPeriod = await TradingRewards.getCurrentPeriod();
			const rewards = await TradingRewards.getAvailableRewardsForAccountForPeriod(
				walletAddress,
				currentPeriod
			);
			return toBigNumber(utils.formatEther(rewards));
		},
		{
			enabled: isAppReady && isWalletConnected,
			...options,
		}
	);
};

export default useAvailableL2TradingRewardsQuery;
