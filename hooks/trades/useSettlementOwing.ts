import { useMemo } from 'react';
import { wei } from '@synthetixio/wei';

import { useSettlementOwing as useSettlementOwingQuery } from 'queries/trades/useSettlementOwing';
import { CurrencyKey } from 'constants/currency';
import { zeroBN } from 'utils/formatters/number';

const useSettlementOwing = (currencyKey: CurrencyKey) => {
	const settlementOwingQuery = useSettlementOwingQuery(currencyKey);
	const { rebate, reclaim, numEntries } = useMemo(() => {
		if (!(settlementOwingQuery.isSuccess && settlementOwingQuery.data))
			return {
				rebate: zeroBN,
				reclaim: zeroBN,
				numEntries: zeroBN,
			};
		const { rebate, reclaim, numEntries } = settlementOwingQuery.data;
		return {
			rebate: wei(rebate),
			reclaim: wei(reclaim),
			numEntries: wei(numEntries),
		};
	}, [settlementOwingQuery.isSuccess, settlementOwingQuery.data]);
	return {
		fee: rebate.sub(reclaim),
		numEntries,
	};
};

export default useSettlementOwing;
