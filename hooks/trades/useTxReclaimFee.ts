import { useMemo } from 'react';
import Wei, { wei } from '@synthetixio/wei';

import { useTxReclaimFee as useTxReclaimFeeQuery } from 'queries/trades/useTxReclaimFee';
import { zeroBN } from 'utils/formatters/number';

const useTxReclaimFee = (timestamp: number): Wei => {
	const txReclaimFeeQuery = useTxReclaimFeeQuery(timestamp);
	const fee = useMemo(() => {
		if (!(txReclaimFeeQuery.isSuccess && txReclaimFeeQuery.data)) return zeroBN;
		return wei(txReclaimFeeQuery.data);
	}, [txReclaimFeeQuery.isSuccess, txReclaimFeeQuery.data]);
	return fee;
};

export default useTxReclaimFee;
