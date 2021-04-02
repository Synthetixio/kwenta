import { useQuery, QueryConfig } from 'react-query';
import { useRecoilValue } from 'recoil';
import { ethers } from 'ethers';
import BigNumber from 'bignumber.js';

import { CurrencyKey } from 'constants/currency';
import { appReadyState } from 'store/app';

import QUERY_KEYS from 'constants/queryKeys';

import synthetix from 'lib/synthetix';
import { toBigNumber } from 'utils/formatters/number';

type ReturnValueType = Record<
	CurrencyKey,
	{
		shorts: BigNumber;
		weeklySNXRewards: BigNumber;
	}
>;

const useCollateralShortStats = (
	currencyKeys: CurrencyKey[],
	options?: QueryConfig<ReturnValueType>
) => {
	const isAppReady = useRecoilValue(appReadyState);

	return useQuery<ReturnValueType>(
		QUERY_KEYS.Collateral.ShortStats(currencyKeys.join('|')),
		async () => {
			const stats = (await Promise.all([
				...currencyKeys.map((currencyKey) =>
					synthetix.js!.contracts.CollateralManager.short(
						ethers.utils.formatBytes32String(currencyKey)
					)
				),
				...currencyKeys.map((currencyKey) =>
					synthetix.js!.contracts[`ShortingRewards${currencyKey}`].getRewardForDuration()
				),
			])) as ethers.BigNumber[];

			const weeklySNXRewards = stats;
			const shorts = stats.splice(0, stats.length / 2);

			return currencyKeys.reduce((ret, key, i) => {
				ret[key] = {
					shorts: toBigNumber(ethers.utils.formatEther(shorts[i])),
					weeklySNXRewards: toBigNumber(weeklySNXRewards[i].toString()).dividedBy(1e18),
				};
				return ret;
			}, {} as ReturnValueType);
		},
		{
			enabled: isAppReady,
			...options,
		}
	);
};

export default useCollateralShortStats;
