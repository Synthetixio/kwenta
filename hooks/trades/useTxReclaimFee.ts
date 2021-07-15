import { useMemo } from 'react';
import BigNumber from 'bignumber.js';

import { useTxReclaimFee as useTxReclaimFeeQuery } from 'queries/trades/useTxReclaimFee';
import { toBigNumber } from 'utils/formatters/number';

const useTxReclaimFee = (timestamp: number): BigNumber => {
	const txReclaimFeeQuery = useTxReclaimFeeQuery(timestamp);
	const fee = useMemo(() => {
		if (!(txReclaimFeeQuery.isSuccess && txReclaimFeeQuery.data)) return toBigNumber(0);
		return txReclaimFeeQuery.data;
	}, [txReclaimFeeQuery.isSuccess, txReclaimFeeQuery.data]);
	return fee;
};

export default useTxReclaimFee;
