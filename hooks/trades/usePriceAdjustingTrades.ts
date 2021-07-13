import { useMemo } from 'react';
import isAfterTime from 'date-fns/isAfter';
import minusTime from 'date-fns/sub';
import orderBy from 'lodash/orderBy';

import { HistoricalTrade } from 'queries/trades/types';
import { useWalletTradesQuery } from 'queries/trades/useWalletTradesQuery';

const usePriceAdjustingTrades = () => {
	const walletTradesQuery = useWalletTradesQuery();
	const trades = useMemo(() => walletTradesQuery.data || [], [walletTradesQuery.data]);
	const recentTrades = useMemo(() => {
		const pastHour = minusTime(new Date(), { hours: 3 });
		const recentTrades = trades.filter((trade) => {
			return isAfterTime(trade.date, pastHour);
		});
		return orderBy(recentTrades, 'timestamp');
	}, [trades]);
	const recentTradesMap = recentTrades.reduce((trades, trade) => {
		trades[`${trade.fromCurrencyKey}-${trade.toCurrencyKey}`] = trade;
		return trades;
	}, {} as Record<string, HistoricalTrade>);
	return Object.entries(recentTradesMap).map(([, trade]) => trade);
};

export default usePriceAdjustingTrades;
