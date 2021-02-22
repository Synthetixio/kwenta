import { useQuery, QueryConfig } from 'react-query';
import { useRecoilValue } from 'recoil';
import BigNumber from 'bignumber.js';

import synthetix from 'lib/synthetix';

import QUERY_KEYS from 'constants/queryKeys';

import { walletAddressState, isWalletConnectedState, networkState } from 'store/wallet';
import { appReadyState } from 'store/app';
import { CurrencyKey } from 'constants/currency';

const useSynthAllowanceQuery = (
	currencyKey: CurrencyKey,
	spenderSynthetixContract: string,
	options?: QueryConfig<BigNumber>
) => {
	const isAppReady = useRecoilValue(appReadyState);
	const isWalletConnected = useRecoilValue(isWalletConnectedState);
	const walletAddress = useRecoilValue(walletAddressState);
	const network = useRecoilValue(networkState);

	return useQuery<BigNumber>(
		QUERY_KEYS.Synths.Allowance(currencyKey, spenderSynthetixContract),
		async () => {
			return await synthetix.js?.contracts['ProxyERC20' + currencyKey].allowance(
				walletAddress,
				synthetix.js?.contracts[spenderSynthetixContract].address
			);
		},
		{
			enabled: isAppReady && isWalletConnected,
			...options,
		}
	);
};

export default useSynthAllowanceQuery;
