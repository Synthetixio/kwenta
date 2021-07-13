import { useMemo } from 'react';
import * as ethers from 'ethers';

import { useSettlementOwing as useSettlementOwingQuery } from 'queries/trades/useSettlementOwing';
import { CurrencyKey } from 'constants/currency';
import { toBigNumber } from 'utils/formatters/number';

const useSettlementOwing = (currencyKey: CurrencyKey) => {
	const settlementOwingQuery = useSettlementOwingQuery(currencyKey);
	const { rebate, reclaim } = useMemo(() => {
		if (!(settlementOwingQuery.isSuccess && settlementOwingQuery.data))
			return { rebate: ethers.BigNumber.from(0), reclaim: ethers.BigNumber.from(0) };
		return settlementOwingQuery.data;
	}, [settlementOwingQuery.isSuccess, settlementOwingQuery.data]);
	return toBigNumber(rebate.sub(reclaim).toString());
};

export default useSettlementOwing;
