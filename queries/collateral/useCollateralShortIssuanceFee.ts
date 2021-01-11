import { useQuery, QueryConfig } from 'react-query';
import { ethers } from 'ethers';
import { useRecoilValue } from 'recoil';
import BigNumber from 'bignumber.js';

import { appReadyState } from 'store/app';

import QUERY_KEYS from 'constants/queryKeys';

import synthetix from 'lib/synthetix';
import { toBigNumber } from 'utils/formatters/number';

const useCollateralShortIssuanceFee = (options?: QueryConfig<BigNumber>) => {
	const isAppReady = useRecoilValue(appReadyState);

	return useQuery<BigNumber>(
		QUERY_KEYS.Collateral.ShortIssuanceFee,
		async () => {
			const feeRateForExchange = (await synthetix.js?.contracts.CollateralShort.issueFeeRate()) as ethers.BigNumber;

			return toBigNumber(ethers.utils.formatEther(feeRateForExchange));
		},
		{
			enabled: isAppReady,
			...options,
		}
	);
};

export default useCollateralShortIssuanceFee;
