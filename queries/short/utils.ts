import BigNumber from 'bignumber.js';
import {
	Short,
	ShortContract,
	ShortLiquidation,
	ShortCollateralChange,
	ShortLoanChange,
	ShortContractUpdate,
} from './types';

import { hexToAscii } from 'utils/formatters/string';
import { DEFAULT_CRYPTO_UNIT } from 'constants/defaults';

export const SHORT_GRAPH_ENDPOINT =
	'https://api.thegraph.com//subgraphs/name/synthetixio-team/synthetix-shorts';

// TODO use big number anywhere - don't think these are related to input fields so not yet?
export const formatShort = (response: any): Partial<Short> => ({
	id: Number(response.id),
	txHash: response.txHash,
	account: response.account,
	collateralLocked: hexToAscii(response.collateralLocked),
	collateralLockedAmount: new BigNumber(response.collateralLockedAmount).div(DEFAULT_CRYPTO_UNIT),
	synthBorrowed: hexToAscii(response.synthBorrowed),
	synthBorrowedAmount: new BigNumber(response.synthBorrowedAmount).div(DEFAULT_CRYPTO_UNIT),
	createdAt: Number(response.createdAt) * 1000,
	createdAtBlock: Number(response.createdAtBlock),
	accruedInterestLastUpdateTimestamp: Number(response.accruedInterestLastUpdateTimestamp) * 1000,
	closedAt: response.closedAt != null ? Number(response.closedAt) * 1000 : null,
	isOpen: Boolean(response.isOpen),
	contractData: formatShortContractData(response.contractData),
	collateralChanges: (response?.collateralChanges ?? []).map(formatShortCollateralChanges),
	liquidations: (response?.liquidations ?? []).map(formatShortLiquidations),
	loanChanges: (response?.loanChanges ?? []).map(formatShortLoanChanges),
});

export const formatShortContractData = (response: any): ShortContract => ({
	id: response.id,
	canOpenLoans: Boolean(response.canOpenLoans),
	interactionDelay: Number(response.interactionDelay),
	issueFeeRate: new BigNumber(response.issueFeeRate).div(DEFAULT_CRYPTO_UNIT),
	manager: response.manager,
	maxLoansPerAccount: response.maxLoansPerAccount,
	minCollateral: new BigNumber(response.minCollateral).div(DEFAULT_CRYPTO_UNIT),
	minCratio: new BigNumber(response.minCratio).div(DEFAULT_CRYPTO_UNIT),
	contractUpdates: (response?.contractUpdates ?? []).map(formatContractUpdates),
});

export const formatContractUpdates = (response: any): ShortContractUpdate => ({
	id: response.id,
	value: String(response.value),
	field: String(response.field),
	timestamp: Number(response.timestamp) * 1000,
	blockNumber: Number(response.blockNumber),
});

export const formatShortLiquidations = (response: any): ShortLiquidation => ({
	id: response.id,
	isClosed: Boolean(response.isClosed),
	liquidatedAmount: new BigNumber(response.liquidatedAmount).div(DEFAULT_CRYPTO_UNIT),
	liquidatedCollateral: new BigNumber(response.liquidatedCollateral).div(DEFAULT_CRYPTO_UNIT),
	liquidator: response.liquidator,
	timestamp: Number(response.timestamp) * 1000,
	blockNumber: Number(response.blockNumber),
});

export const formatShortCollateralChanges = (response: any): ShortCollateralChange => ({
	amount: new BigNumber(response.amount).div(DEFAULT_CRYPTO_UNIT),
	collateralAfter: new BigNumber(response.collateralAfter),
	id: response.id,
	isDeposit: Boolean(response.isDeposit),
	timestamp: Number(response.timestamp) * 1000,
	blockNumber: Number(response.blockNumber),
});

export const formatShortLoanChanges = (response: any): ShortLoanChange => ({
	amount: new BigNumber(response.amount).div(DEFAULT_CRYPTO_UNIT),
	id: response.id,
	isRepayment: Boolean(response.isRepayment),
	loanAfter: new BigNumber(response.loanAfter).div(DEFAULT_CRYPTO_UNIT),
	timestamp: Number(response.timestamp) * 1000,
	blockNumber: Number(response.blockNumber),
});
