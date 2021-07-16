import { useMemo } from 'react';

import useFeeReclaimPeriodQuery from 'queries/synths/useFeeReclaimPeriodQuery';
import { CurrencyKey } from 'constants/currency';

const useFeeReclaimPeriod = (currencyKey: CurrencyKey): number => {
	const query = useFeeReclaimPeriodQuery(currencyKey);
	const ret = useMemo(() => {
		if (!(query.isSuccess && query.data)) return 0;
		return query.data;
	}, [query.isSuccess, query.data]);
	return ret;
};

export default useFeeReclaimPeriod;
