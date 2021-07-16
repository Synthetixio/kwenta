import { useQuery, QueryConfig } from 'react-query';
import synthetixData from '@synthetixio/data';
import { useRecoilValue } from 'recoil';
import BigNumber from 'bignumber.js';

import { isWalletConnectedState, walletAddressState } from 'store/wallet';
import QUERY_KEYS from 'constants/queryKeys';
import { networkState } from 'store/wallet';
import { toBigNumber } from 'utils/formatters/number';

export const useTxReclaimFee = (timestamp: number, options?: QueryConfig<BigNumber>) => {
	const isWalletConnected = useRecoilValue(isWalletConnectedState);
	const walletAddress = useRecoilValue(walletAddressState);
	const network = useRecoilValue(networkState);

	return useQuery<BigNumber>(
		QUERY_KEYS.Trades.TxReclaimFee(walletAddress || '', network?.id!, timestamp),
		async () => {
			const exchangeEntrySettleds = await synthetixData({
				networkId: network?.id!,
			}).exchangeEntrySettleds({
				from: walletAddress ?? undefined,
				minExchangeTimestamp: timestamp,
				maxExchangeTimestamp: timestamp,
			});
			const exchangeEntrySettled = exchangeEntrySettleds?.[0];
			if (!exchangeEntrySettled) return toBigNumber(0);
			return toBigNumber(exchangeEntrySettled.rebate - exchangeEntrySettled.reclaim);
		},
		{
			enabled: isWalletConnected,
			...options,
		}
	);
};

export default useTxReclaimFee;
