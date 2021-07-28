import { useMemo } from 'react';
import { useRecoilValue } from 'recoil';

import useSynthetixQueries from '@synthetixio/queries';
import { CurrencyKey } from 'constants/currency';
import { walletAddressState } from 'store/wallet';

const useFeeReclaimPeriod = (currencyKey: CurrencyKey): number => {
	const { useFeeReclaimPeriodQuery } = useSynthetixQueries();
	const walletAddress = useRecoilValue(walletAddressState);

	const query = useFeeReclaimPeriodQuery(currencyKey, walletAddress);
	const ret = useMemo(() => {
		if (!(query.isSuccess && query.data)) return 0;
		return query.data;
	}, [query.isSuccess, query.data]);
	return ret;
};

export default useFeeReclaimPeriod;
