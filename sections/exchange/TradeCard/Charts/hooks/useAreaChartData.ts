import { CurrencyKey } from 'constants/currency';
import { PeriodLabel } from 'constants/period';
import useHistoricalRatesQuery from 'queries/rates/useHistoricalRatesQuery';

const useAreaChartData = ({
	currencyKey,
	selectedPeriod,
}: {
	currencyKey: CurrencyKey | null;
	selectedPeriod: PeriodLabel;
}) => {
	const data = useHistoricalRatesQuery(currencyKey, selectedPeriod.period);

	const change = data.data?.change ?? null;
	// eslint-disable-next-line
	const rates = data.data?.rates ?? [];

	const noData = data.isSuccess && data.data && data.data.rates.length === 0;

	return {
		noData,
		change,
		rates,
		isLoading: data.isLoading,
	};
};

export default useAreaChartData;
