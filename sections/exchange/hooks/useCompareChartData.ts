import { useMemo } from 'react';
import orderBy from 'lodash/orderBy';

import useHistoricalRatesQuery from 'queries/rates/useHistoricalRatesQuery';
import usePeriodStartSynthRateQuery from 'queries/rates/usePeriodStartSynthRateQuery';
import { CurrencyKey, SYNTHS_MAP } from 'constants/currency';
import { PeriodLabel } from 'constants/period';

const useCombinedRates = ({
	baseCurrencyKey,
	quoteCurrencyKey,
	selectedPeriod,
}: {
	baseCurrencyKey: CurrencyKey | null;
	quoteCurrencyKey: CurrencyKey | null;
	selectedPeriod: PeriodLabel;
}) => {
	const baseHistoricalRates = useHistoricalRatesQuery(baseCurrencyKey, selectedPeriod.period);
	const quoteHistoricalRates = useHistoricalRatesQuery(quoteCurrencyKey, selectedPeriod.period);

	const { data: baseInitialRate } = usePeriodStartSynthRateQuery(
		baseCurrencyKey,
		selectedPeriod.period
	);
	const { data: quoteInitialRate } = usePeriodStartSynthRateQuery(
		quoteCurrencyKey,
		selectedPeriod.period
	);

	const baseRates = useMemo(() => baseHistoricalRates.data?.rates ?? [], [baseHistoricalRates]);
	const quoteRates = useMemo(() => quoteHistoricalRates.data?.rates ?? [], [quoteHistoricalRates]);

	const baseNoData =
		baseHistoricalRates.isSuccess &&
		baseHistoricalRates.data &&
		baseHistoricalRates.data.rates.length === 0;
	const quoteNoData =
		quoteHistoricalRates.isSuccess &&
		quoteHistoricalRates.data &&
		quoteHistoricalRates.data.rates.length === 0;
	const noData = baseNoData || quoteNoData;

	const data = useMemo(() => {
		if (!(baseRates.length && quoteRates.length && baseInitialRate && quoteInitialRate)) return [];

		if (!(baseRates.length && quoteRates.length && baseInitialRate && quoteInitialRate)) return [];

		let allRates: {
			isBaseRate?: boolean;
			timestamp: number;
			rate: number;
		}[] = [];
		if (baseCurrencyKey !== SYNTHS_MAP.sUSD) {
			allRates = allRates.concat(baseRates.map((r) => ({ ...r, isBaseRate: true })));
		}
		if (quoteCurrencyKey !== SYNTHS_MAP.sUSD) {
			allRates = allRates.concat(quoteRates);
		}
		allRates = orderBy(allRates, 'timestamp');

		let prevBaseRate = baseInitialRate.rate;
		let prevQuoteRate = quoteInitialRate.rate;

		return allRates.reduce((chartData, { isBaseRate, rate, timestamp }) => {
			let baseRate: number = 0;
			let quoteRate: number = 0;
			if (isBaseRate) {
				baseRate = prevBaseRate = rate;
				quoteRate = prevQuoteRate;
			} else {
				quoteRate = prevQuoteRate = rate;
				baseRate = prevBaseRate;
			}
			return chartData.concat({ timestamp, baseRate, quoteRate });
		}, [] as { timestamp: number; baseRate: number; quoteRate: number }[]);
	}, [baseRates, quoteRates, baseInitialRate, quoteInitialRate, baseCurrencyKey, quoteCurrencyKey]);

	return {
		data,
		noData,
		isLoadingRates: baseHistoricalRates.isLoading || quoteHistoricalRates.isLoading,
	};
};

export default useCombinedRates;
