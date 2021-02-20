import { CurrencyKey } from 'constants/currency';
import BigNumber from 'bignumber.js';

export type Short = {
	id: number;
	txHash: string;
	account: string;
	collateralLocked: CurrencyKey;
	collateralLockedAmount: BigNumber;
	collateralLockedPrice: number;
	synthBorrowed: CurrencyKey;
	synthBorrowedAmount: BigNumber;
	synthBorrowedPrice: number;
	accruedInterestLastUpdateTimestamp: number;
	createdAtBlock: number;
	createdAt: number;
	closedAt: number | null;
	isOpen: boolean;
	contractData?: ShortContract;
	interestAccrued: BigNumber;
	profitLoss: BigNumber;
	collateralChanges?: ShortCollateralChange[];
	liquidations?: ShortLiquidation[];
	loanChanges: ShortLoanChange[];
};

export type ShortCollateralChange = {
	id: string;
	isDeposit: boolean;
	amount: BigNumber;
	collateralAfter: BigNumber;
	short?: Short;
	timestamp: number;
	blockNumber: number;
};

export type ShortLoanChange = {
	id: string;
	isRepayment: boolean;
	amount: BigNumber;
	loanAfter: BigNumber;
	short?: Short;
	timestamp: number;
	blockNumber: number;
};

export type ShortLiquidation = {
	id: string;
	liquidator: string;
	isClosed: boolean;
	liquidatedAmount: BigNumber;
	liquidatedCollateral: BigNumber;
	short?: Short;
	timestamp: number;
	blockNumber: number;
};

export type ShortContract = {
	id: string;
	shorts?: Short[];
	contractUpdates: ShortContractUpdate[];
	canOpenLoans: boolean;
	interactionDelay: number;
	issueFeeRate: BigNumber;
	maxLoansPerAccount: number;
	minCollateral: BigNumber;
	minCratio: BigNumber;
	manager: string;
};

export type ShortContractUpdate = {
	id: string;
	field: string;
	value: string;
	contractData?: ShortContract;
	timestamp: number;
	blockNumber: number;
};

export type InterestRateHistory = {
	rate: string;
	timestamp: number;
};

export type SynthBorrowedHistoryItem = {
	rate: BigNumber;
	amount: BigNumber;
	isRepayment: boolean;
	loanAfter: BigNumber;
	timestamp: number;
};
