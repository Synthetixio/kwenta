import { Network } from 'store/wallet';

export const GWEI_UNIT = 1000000000;

export const getBisonTrailsRpcURL = (network: Network) =>
	`https://${process.env.NEXT_PUBLIC_BT_PROJECT_ID}.ethereum.bison.run`;
