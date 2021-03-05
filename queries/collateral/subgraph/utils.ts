import { HistoricalShortPosition, ShortLiquidation } from './types';
import { hexToAscii } from 'utils/formatters/string';
import { toBigNumber } from 'utils/formatters/number';

// MainNet - 'https://api.thegraph.com/subgraphs/name/synthetixio-team/synthetix-shorts';
// Kovan - 'https://api.thegraph.com/subgraphs/name/vbstreetz/synthetix-shorts-kovan'

export const SHORT_GRAPH_ENDPOINT =
	'https://api.thegraph.com/subgraphs/name/vbstreetz/synthetix-shorts-kovan';

export const formatShort = (response: any): Partial<HistoricalShortPosition> => ({
	id: response.id,
	txHash: response.txHash,
	collateralLocked: hexToAscii(response.collateralLocked),
	collateralLockedAmount: toBigNumber(response.collateralLockedAmount).div(1e18),
	synthBorrowed: hexToAscii(response.synthBorrowed),
	synthBorrowedAmount: toBigNumber(response.synthBorrowedAmount).div(1e18),
	createdAt: new Date(Number(response.createdAt) * 1000),
	closedAt: response.closedAt != null ? new Date(Number(response.closedAt) * 1000) : null,
	isOpen: Boolean(response.isOpen),
	collateralChanges: (response?.collateralChanges ?? []).map(formatShortCollateralChanges),
	liquidations: (response?.liquidations ?? []).map(formatShortLiquidations),
	loanChanges: (response?.loanChanges ?? []).map(formatShortLoanChanges),
});

export const formatShortLiquidations = (response: any): ShortLiquidation => ({
	id: response.id,
	isClosed: Boolean(response.isClosed),
	liquidatedAmount: toBigNumber(response.liquidatedAmount).div(1e18),
	liquidatedCollateral: toBigNumber(response.liquidatedCollateral).div(1e18),
	liquidator: response.liquidator,
	timestamp: Number(response.timestamp) * 1000,
});

export const formatShortCollateralChanges = (response: any) => ({
	amount: toBigNumber(response.amount).div(1e18),
	collateralAfter: toBigNumber(response.collateralAfter),
	id: response.id,
	isDeposit: Boolean(response.isDeposit),
	timestamp: Number(response.timestamp) * 1000,
});

export const formatShortLoanChanges = (response: any) => ({
	amount: toBigNumber(response.amount).div(1e18),
	id: response.id,
	isRepayment: Boolean(response.isRepayment),
	loanAfter: toBigNumber(response.loanAfter).div(1e18),
	timestamp: Number(response.timestamp) * 1000,
});
