import { useMemo } from 'react';
import orderBy from 'lodash/orderBy';

import useHistoricalRatesQuery from 'queries/rates/useHistoricalRatesQuery';
import useLatestSynthRateQuery from 'queries/rates/useLatestSynthRateQuery';
import { CurrencyKey } from 'constants/currency';
import { PeriodLabel } from 'constants/period';

const useCombinedRates = ({
	baseCurrencyKey,
	quoteCurrencyKey,
	basePriceRate,
	quotePriceRate,
	selectedPeriod,
}: {
	baseCurrencyKey: CurrencyKey | null;
	quoteCurrencyKey: CurrencyKey | null;
	basePriceRate: number | null;
	quotePriceRate: number | null;
	selectedPeriod: PeriodLabel;
}) => {
	const baseHistoricalRates = useHistoricalRatesQuery(baseCurrencyKey, selectedPeriod.period);
	const quoteHistoricalRates = useHistoricalRatesQuery(quoteCurrencyKey, selectedPeriod.period);

	const { data: baseInitialRate } = useLatestSynthRateQuery(baseCurrencyKey, selectedPeriod.period);
	const { data: quoteInitialRate } = useLatestSynthRateQuery(
		quoteCurrencyKey,
		selectedPeriod.period
	);

	const baseChange = useMemo(() => baseHistoricalRates.data?.change ?? null, [baseHistoricalRates]);
	const quoteChange = useMemo(() => quoteHistoricalRates.data?.change ?? null, [
		quoteHistoricalRates,
	]);
	const baseRates = useMemo(() => baseHistoricalRates.data?.rates ?? [], [baseHistoricalRates]);
	const quoteRates = useMemo(() => quoteHistoricalRates.data?.rates ?? [], [quoteHistoricalRates]);

	const change = useMemo(() => (baseChange! ?? 1) - (quoteChange! ?? 1), [quoteChange, baseChange]);

	const baseNoData =
		baseHistoricalRates.isSuccess &&
		baseHistoricalRates.data &&
		baseHistoricalRates.data.rates.length === 0;
	const quoteNoData =
		quoteHistoricalRates.isSuccess &&
		quoteHistoricalRates.data &&
		quoteHistoricalRates.data.rates.length === 0;
	const noData = baseNoData || quoteNoData;

	const changes = useMemo(() => {
		if (!(baseRates.length && quoteRates.length && baseInitialRate && quoteInitialRate)) return [];

		const allRates: {
			isBaseRate?: boolean;
			timestamp: number;
			rate: number;
		}[] = orderBy(
			[...baseRates.map((r) => ({ ...r, isBaseRate: true })), ...quoteRates],
			'timestamp'
		);

		let prevBaseRate = baseInitialRate;
		let prevQuoteRate = quoteInitialRate;
		const initalChange = {
			timestamp: baseRates[0].timestamp,
			change: prevBaseRate / prevQuoteRate,
		};

		return allRates.reduce(
			(changes, { isBaseRate, rate, timestamp }) => {
				let change: number = 0;
				if (isBaseRate) {
					change = rate / prevQuoteRate;
					prevBaseRate = rate;
				} else {
					change = prevBaseRate / rate;
					prevQuoteRate = rate;
				}

				return changes.concat({ timestamp, change });
			},
			[initalChange]
		);
	}, [baseRates, quoteRates, baseInitialRate, quoteInitialRate]);

	const [low, high] = useMemo(() => {
		if (changes.length < 2) return [0, 0];
		const sortedChanges = orderBy(changes, 'change');
		return [0, sortedChanges.length - 1].map((index) => sortedChanges[index].change);
	}, [changes]);

	return {
		changes,
		change,
		noData,
		isLoadingRates: baseHistoricalRates.isLoading || quoteHistoricalRates.isLoading,
		low,
		high,
	};
};

export default useCombinedRates;
