import { CurrencyKey } from 'constants/currency';
import * as ethers from 'ethers';

export type HistoricalTrade = {
	block: number;
	date: Date;
	feesInUSD: number;
	fromAddress: string;
	fromAmount: number;
	fromAmountInUSD: number;
	fromCurrencyKey: CurrencyKey;
	fromCurrencyKeyBytes: string;
	gasPrice: number;
	hash: string;
	timestamp: number;
	toAddress: string;
	toAmount: number;
	toAmountInUSD: number;
	toCurrencyKey: CurrencyKey;
	toCurrencyKeyBytes: string;
	price: number;
	amount: number;
	isSettled: boolean;
	reclaim: number;
	rebate: number;
	settledPrice: number;
};

export type HistoricalTrades = HistoricalTrade[];

export type SettlementOwing = {
	reclaim: ethers.BigNumber;
	rebate: ethers.BigNumber;
};
