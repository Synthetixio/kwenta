import React, { FC } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import Tippy from '@tippyjs/react';

import { HistoricalTrade } from 'queries/trades/types';

import { formatCryptoCurrency } from 'utils/formatters/number';

import useTxReclaimFee from 'hooks/trades/useTxReclaimFee';

const TxReclaimFee: FC<{ trade: HistoricalTrade }> = ({ trade }) => {
	const { t } = useTranslation();
	const fee = useTxReclaimFee(trade.timestamp / 1000);
	return (
		<Tooltip
			placement="top"
			content={<div>{t('dashboard.transactions.table.tx-reclaim-fee-hint')}</div>}
		>
			<TxReclaimFeeLabel isPositive={!fee.isNegative()}>
				{formatCryptoCurrency(fee, { currencyKey: trade.toCurrencyKey })}
			</TxReclaimFeeLabel>
		</Tooltip>
	);
};

export default TxReclaimFee;

const Tooltip = styled(Tippy)`
	font-size: 12px;
	background-color: ${(props) => props.theme.colors.navy};
	color: ${(props) => props.theme.colors.white};
	.tippy-arrow {
		color: ${(props) => props.theme.colors.navy};
	}
`;

const TxReclaimFeeLabel = styled.span<{ isPositive: boolean }>`
	color: ${(props) => (props.isPositive ? props.theme.colors.green : props.theme.colors.red)};
`;
