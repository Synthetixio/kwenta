import { useQuery, QueryConfig } from 'react-query';
import { useRecoilValue } from 'recoil';
import { request } from 'graphql-request';

import { appReadyState } from 'store/app';
import { walletAddressState, isWalletConnectedState } from 'store/wallet';
import QUERY_KEYS from 'constants/queryKeys';

import { Short } from './types';
import { query } from './query';

const SHORT_GRAPH_ENDPOINT = 'https://api.thegraph.com//subgraphs/name/dvd-schwrtz/test';

const useShortHistoryQuery = (options?: QueryConfig<Short[]>) => {
	const isAppReady = useRecoilValue(appReadyState);
	const isWalletConnected = useRecoilValue(isWalletConnectedState);
	const walletAddress = useRecoilValue(walletAddressState);

	return useQuery<Short[]>(
		QUERY_KEYS.Collateral.ShortHistory(walletAddress ?? ''),
		async () => {
			const tempRequest = await request(SHORT_GRAPH_ENDPOINT, query, {
				account: walletAddress,
			});
			console.log('tempRequest', tempRequest);
			return [
				{
					account: '0x62f7a1f94aba23ed2dd108f8d23aa3e7d452565b',
					closedAt: null,
					collateralChanges: [
						{
							id: '0xf695e5c2e8d4af92ecd553e7da3164eeffcb96f3d0bc5d82a9e92332f4cc06c9-129',
						},
					],
					collateralLocked: '0x7355534400000000000000000000000000000000000000000000000000000000',
					collateralLockedAmount: '44650504719745945992',
					contractData: {
						canOpenLoans: true,
						id: '0x1f2c3a1046c32729862fcb038369696e3273a516',
						interactionDelay: '3600',
						issueFeeRate: '5000000000000000',
						maxLoansPerAccount: '50',
						minCollateral: '1000000000000000000000',
						minCratio: '1200000000000000000',
					},
					createdAt: '1610688253',
					id: '47',
					isOpen: true,
					liquidations: [
						{
							id: '0x2164bdf7a846d0c944777135040f34861a18a7d3bc18c34f1787193370df91ba-205',
						},
						{
							id: '0xb525b1ff59e5e58e9426a0b16eb95edfd61c9c33d87b3121e71e22279a245a76-188',
						},
					],
					loanChanges: [
						{
							id: '0x0dcf6fc58c41abf5ef649b09cfc99f50c3e2e476f8bac138d2708590d441b04a-109',
						},
					],
					synthBorrowed: '0x7345544800000000000000000000000000000000000000000000000000000000',
					synthBorrowedAmount: '26194964020240575',
					txHash: '0xc07149d6d41f30f9e3e85ecee7ac777eba7dc381c04eebd60f14418fc6b8e4a1',
				},
				{
					account: '0xe67163ab11d4b39c5616bd84bbdf8efbdf7a5d00',
					closedAt: '1610725555',
					collateralChanges: [],
					collateralLocked: '0x7355534400000000000000000000000000000000000000000000000000000000',
					collateralLockedAmount: '1000000000000000000000',
					contractData: {
						canOpenLoans: true,
						id: '0x1f2c3a1046c32729862fcb038369696e3273a516',
						interactionDelay: '3600',
						issueFeeRate: '5000000000000000',
						maxLoansPerAccount: '50',
						minCollateral: '1000000000000000000000',
						minCratio: '1200000000000000000',
					},
					createdAt: '1610702444',
					id: '51',
					isOpen: false,
					liquidations: [],
					loanChanges: [],
					synthBorrowed: '0x7345544800000000000000000000000000000000000000000000000000000000',
					synthBorrowedAmount: '500000000000000000',
					txHash: '0x44c6c5b815b65fe40ec0c7437434bb74336fb15da17d3383e09d5a301905e8d0',
				},
			];
		},
		{
			enabled: isAppReady && isWalletConnected,
			...options,
		}
	);
};

export default useShortHistoryQuery;
