import * as ethers from 'ethers';
import BigNumber from 'bignumber.js';
import { CurrencyKey } from 'constants/currency';

export type HistoricalTrade = {
	block: number;
	feesInUSD: number;
	from: string;
	fromAmount: number;
	fromAmountInUSD: number;
	fromCurrencyKey: CurrencyKey;
	gasPrice: number;
	timestamp: number;
	toAddress: string;
	toAmount: number;
	toAmountInUSD: number;
	toCurrencyKey: CurrencyKey;
	id: string;
	account: string;
	network: string;
	hash: string;
};

export type HistoricalTrades = HistoricalTrade[];

export type SettlementOwing = {
	reclaim: ethers.BigNumber;
	rebate: ethers.BigNumber;
	numEntries: ethers.BigNumber;
};

export type SynthFeeAndWaitingPeriod = {
	currencyKey: CurrencyKey;
	fee: BigNumber;
	waitingPeriod: number;
	noOfTrades: number;
};
