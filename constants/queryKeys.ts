import { QueryKeyOrPredicateFn } from 'react-query';
import { CurrencyKey } from './currency';
import { Period } from './period';

export const QUERY_KEYS = {
	Rates: {
		HistoricalVolume: (currencyKey: CurrencyKey, period: Period) => [
			'rates',
			'historicalVolume',
			currencyKey,
			period,
		],
		TrendingSynthsVolume: ['rates', 'historicalVolume', 'trendingSynths'],
		HistoricalRates: (currencyKey: CurrencyKey, period: Period): QueryKeyOrPredicateFn => [
			'rates',
			'historicalRates',
			currencyKey,
			period,
		],
		MarketCap: (currencyKey: CurrencyKey) => ['marketCap', currencyKey],
		ExchangeRates: ['rates', 'exchangeRates'],
		SynthExchanges: (period: Period) => ['rates', 'synthExchanges', period],
	},
	Network: {
		EthGasStation: ['network', 'ethGasStation'],
	},
	WalletBalances: {
		Synths: (walletAddress: string) => ['walletBalances', 'synths', walletAddress],
		ETH: (walletAddress: string) => ['walletBalances', 'ETH', walletAddress],
		Tokens: (walletAddress: string) => ['walletBalances', 'tokens', walletAddress],
	},
	Synths: {
		FrozenSynths: ['synths', 'frozenSynths'],
		Suspension: (currencyKey: CurrencyKey) => ['synths', 'suspension', currencyKey],
		FeeReclaimPeriod: (currencyKey: CurrencyKey) => ['synths', 'feeReclaimPeriod', currencyKey],
	},
	Trades: {
		AllTrades: ['trades', 'allTrades'],
		WalletTrades: (walletAddress: string) => ['trades', 'walletTrades', walletAddress],
	},
};

export default QUERY_KEYS;
