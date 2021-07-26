import { FC, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { Svg } from 'react-optimized-image';
import Tippy from '@tippyjs/react';
import { differenceInMinutes } from 'date-fns';

import { HistoricalTrade } from 'queries/trades/types';

import CircleEllipsis from 'assets/svg/app/circle-ellipsis.svg';
import CircleTick from 'assets/svg/app/circle-tick.svg';

import useFeeReclaimPeriod from 'hooks/synths/useFeeReclaimPeriod';

const SynthFeeReclaimStatus: FC<{ trade: HistoricalTrade }> = ({ trade }) => {
	const { t } = useTranslation();
	const secs = useFeeReclaimPeriod(trade.toCurrencyKey);
	const isFreshTrade = useMemo(
		() => differenceInMinutes(new Date(), new Date(trade.timestamp)) < 30,
		[trade.timestamp]
	); // todo: determine this by comparing toCurrencyKey trade index against numEntries returned by Exchanger.settlementOwing
	const isConfirmed = secs === 0 || !isFreshTrade;

	return (
		<Tooltip
			placement="top"
			content={<div>{t('dashboard.transactions.table.price-adjustment-hint')}</div>}
			disabled={isConfirmed}
		>
			{isConfirmed ? (
				<ConfirmedIcon>
					<Svg src={CircleTick} />
				</ConfirmedIcon>
			) : (
				<PendingIcon>
					<Svg src={CircleEllipsis} />
				</PendingIcon>
			)}
		</Tooltip>
	);
};

export default SynthFeeReclaimStatus;

const Tooltip = styled(Tippy)`
	font-size: 12px;
	background-color: ${(props) => props.theme.colors.navy};
	color: ${(props) => props.theme.colors.white};
	.tippy-arrow {
		color: ${(props) => props.theme.colors.navy};
	}
`;

const StatusIconMixin = `
    padding-left: 5px;
    display: inline-flex;
`;

const ConfirmedIcon = styled.span`
	${StatusIconMixin};
	color: ${(props) => props.theme.colors.green};
`;

const PendingIcon = styled.span`
	${StatusIconMixin};
	color: ${(props) => props.theme.colors.yellow};
`;
