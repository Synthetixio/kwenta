import { CurrencyKey } from 'constants/currency';
import { PeriodLabel } from 'constants/period';
import useCandlesticksQuery from 'queries/rates/useCandlesticksQuery';

const useCandleSticksChartData = ({
	currencyKey,
	selectedPeriod,
}: {
	currencyKey: CurrencyKey | null;
	selectedPeriod: PeriodLabel;
}) => {
	const query = useCandlesticksQuery(currencyKey, selectedPeriod.period);
	const data = query.isSuccess && query.data ? query.data : [];

	const noData = query.isSuccess && query.data && data.length === 0;

	return {
		data,
		noData,
		isLoading: query.isLoading,
	};
};

export default useCandleSticksChartData;
