import { useQuery } from 'react-query';
import { useRecoilValue } from 'recoil';
import { formatBytes32String } from 'ethers/lib/utils';

import { isWalletConnectedState, walletAddressState } from 'store/wallet';
import QUERY_KEYS from 'constants/queryKeys';
import { CurrencyKey } from 'constants/currency';
import Connector from 'containers/Connector';

import { SettlementOwing } from './types';

export const useSettlementOwing = (currencyKey: CurrencyKey) => {
	const isWalletConnected = useRecoilValue(isWalletConnectedState);
	const walletAddress = useRecoilValue(walletAddressState);
	const { synthetixjs } = Connector.useContainer();

	return useQuery<SettlementOwing>(
		QUERY_KEYS.Trades.SettlementOwing(walletAddress || '', currencyKey),
		async () => {
			const [rebate, reclaim, numEntries] = await synthetixjs?.contracts.Exchanger.settlementOwing(
				walletAddress,
				formatBytes32String(currencyKey)
			);
			return { rebate, reclaim, numEntries };
		},
		{
			enabled: isWalletConnected,
		}
	);
};
