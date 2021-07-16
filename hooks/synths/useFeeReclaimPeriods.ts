import { useMemo } from 'react';

import useFeeReclaimPeriodsQuery from 'queries/synths/useFeeReclaimPeriodsQuery';
import { SynthFeeAndWaitingPeriod } from 'queries/trades/types';

const useFeeReclaimPeriods = (): SynthFeeAndWaitingPeriod[] => {
	const query = useFeeReclaimPeriodsQuery();
	const ret = useMemo(() => {
		if (!(query.isSuccess && query.data)) return [];
		return query.data;
	}, [query.isSuccess, query.data]);
	return ret;
};

export default useFeeReclaimPeriods;
