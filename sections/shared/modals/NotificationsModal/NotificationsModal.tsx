import { FC, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRecoilValue } from 'recoil';
import useSynthetixQueries from '@synthetixio/queries';

import { walletAddressState } from 'store/wallet';
import { ordersByStatusState } from 'store/orders';

import FullScreen from './FullScreen';
import Popup from './Popup';

type NotificationsModalProps = {
	onDismiss: () => void;
};

export const NotificationsModal: FC<NotificationsModalProps> = ({ onDismiss }) => {
	const { t } = useTranslation();
	const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
	const ordersByStatus = useRecoilValue(ordersByStatusState);
	const walletAddress = useRecoilValue(walletAddressState);

	const { useFeeReclaimPeriodsQuery } = useSynthetixQueries();
	const feeAndWaitingPeriodsQuery = useFeeReclaimPeriodsQuery(walletAddress ?? '');
	const feeAndWaitingPeriods = useMemo(() => feeAndWaitingPeriodsQuery.data ?? [], [
		feeAndWaitingPeriodsQuery.data,
	]);
	const hasWaitingPeriod = useMemo(
		() => !!feeAndWaitingPeriods.find((fw) => fw.waitingPeriod !== 0),
		[feeAndWaitingPeriods]
	);

	const orderGroups = useMemo(
		() => [
			{
				id: 'pending-orders',
				title: t('modals.notifications.open-orders.title'),
				data: ordersByStatus.pending,
				noResults: t('modals.notifications.open-orders.no-results'),
			},
			{
				id: 'confirmed-orders',
				title: isFullScreen
					? t('modals.notifications.all-notifications.title')
					: t('modals.notifications.recent-notifications.title'),
				data: isFullScreen ? ordersByStatus.confirmed : ordersByStatus.confirmed.slice(0, 4),
				noResults: t('modals.notifications.recent-notifications.no-results'),
			},
		],
		[ordersByStatus, isFullScreen, t]
	);

	return isFullScreen ? (
		<FullScreen {...{ onDismiss, feeWaitingPeriods, hasWaitingPeriod, orderGroups }} />
	) : (
		<Popup
			{...{
				onDismiss,
				feeWaitingPeriods,
				hasWaitingPeriod,
				orderGroups,
				setIsFullScreen,
				ordersByStatus,
			}}
		/>
	);
};

export default NotificationsModal;
