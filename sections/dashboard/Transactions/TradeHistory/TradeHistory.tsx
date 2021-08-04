import React, { FC, useMemo } from 'react';
import styled from 'styled-components';
import { Trans, useTranslation } from 'react-i18next';
import { CellProps } from 'react-table';
import { Svg } from 'react-optimized-image';
import { SynthExchangeExpanded } from '@synthetixio/data/build/node/src/types';

import { formatCurrency } from 'utils/formatters/number';

import { NO_VALUE } from 'constants/placeholder';

import { ExternalLink, GridDivCenteredRow, NoTextTransform } from 'styles/common';

import Etherscan from 'containers/Etherscan';

import Table from 'components/Table';
import Currency from 'components/Currency';

import LinkIcon from 'assets/svg/app/link.svg';
import NoNotificationIcon from 'assets/svg/app/no-notifications.svg';
import useSelectedPriceCurrency from 'hooks/useSelectedPriceCurrency';

import SynthFeeReclaimStatus from './SynthFeeReclaimStatus';
import TxReclaimFee from './TxReclaimFee';

type TradeHistoryProps = {
	trades: SynthExchangeExpanded[];
	isLoading: boolean;
	isLoaded: boolean;
};

const TradeHistory: FC<TradeHistoryProps> = ({ trades, isLoading, isLoaded }) => {
	const { t } = useTranslation();
	const { etherscanInstance } = Etherscan.useContainer();
	const { selectPriceCurrencyRate, selectedPriceCurrency } = useSelectedPriceCurrency();

	const columnsDeps = useMemo(() => [selectPriceCurrencyRate], [selectPriceCurrencyRate]);

	return (
		<StyledTable
			palette="primary"
			columns={[
				{
					Header: (
						<StyledTableHeader>{t('dashboard.transactions.table.orderType')}</StyledTableHeader>
					),
					accessor: 'orderType',
					Cell: (cellProps: CellProps<SynthExchangeExpanded>) => (
						<StyledOrderType>
							{t('dashboard.transactions.order-type-sort.market')}
							<SynthFeeReclaimStatus trade={cellProps.row.original} />
						</StyledOrderType>
					),
					sortable: true,
					width: 125,
				},
				{
					Header: <StyledTableHeader>{t('dashboard.transactions.table.from')}</StyledTableHeader>,
					accessor: 'fromAmount',
					sortType: 'basic',
					Cell: (cellProps: CellProps<SynthExchangeExpanded>) => (
						<span>
							<StyledCurrencyKey>{cellProps.row.original.fromCurrencyKey}</StyledCurrencyKey>
							<StyledPrice>
								{formatCurrency(
									cellProps.row.original.fromCurrencyKey,
									cellProps.row.original.fromAmount
								)}
							</StyledPrice>
						</span>
					),
					width: 175,
					sortable: true,
				},
				{
					Header: <StyledTableHeader>{t('dashboard.transactions.table.to')}</StyledTableHeader>,
					accessor: 'toAmount',
					sortType: 'basic',
					Cell: (cellProps: CellProps<SynthExchangeExpanded>) => (
						<span>
							<StyledCurrencyKey>{cellProps.row.original.toCurrencyKey}</StyledCurrencyKey>
							<StyledPrice>
								{formatCurrency(
									cellProps.row.original.toCurrencyKey,
									cellProps.row.original.toAmount
								)}
							</StyledPrice>
						</span>
					),
					width: 175,
					sortable: true,
				},
				{
					Header: (
						<StyledTableHeader>
							<Trans
								i18nKey="common.currency.currency-value"
								values={{ currencyKey: selectedPriceCurrency.asset }}
								components={[<NoTextTransform />]}
							/>
						</StyledTableHeader>
					),
					accessor: 'amount',
					sortType: 'basic',
					Cell: (cellProps: CellProps<SynthExchangeExpanded>) => (
						<Currency.Price
							currencyKey={cellProps.row.original.toCurrencyKey}
							price={cellProps.row.original.toAmountInUSD}
							sign={selectedPriceCurrency.sign}
							conversionRate={selectPriceCurrencyRate}
						/>
					),
					width: 175,
					sortable: true,
				},
				{
					Header: (
						<StyledTableHeader>{t('dashboard.transactions.table.fee-reclaim')}</StyledTableHeader>
					),
					accessor: 'timestamp',
					sortType: 'basic',
					Cell: (cellProps: CellProps<SynthExchangeExpanded>) => (
						<TxReclaimFee trade={cellProps.row.original} />
					),
					width: 175,
					sortable: true,
				},
				{
					id: 'link',
					Cell: (cellProps: CellProps<SynthExchangeExpanded>) =>
						etherscanInstance != null && cellProps.row.original.hash ? (
							<StyledExternalLink href={etherscanInstance.txLink(cellProps.row.original.hash)}>
								<StyledLinkIcon
									src={LinkIcon}
									viewBox={`0 0 ${LinkIcon.width} ${LinkIcon.height}`}
								/>
							</StyledExternalLink>
						) : (
							NO_VALUE
						),
					width: 50,
					sortable: false,
				},
			]}
			columnsDeps={columnsDeps}
			data={trades}
			isLoading={isLoading && !isLoaded}
			noResultsMessage={
				isLoaded && trades.length === 0 ? (
					<TableNoResults>
						<Svg src={NoNotificationIcon} />
						{t('dashboard.transactions.table.no-results')}
					</TableNoResults>
				) : undefined
			}
			showPagination={true}
		/>
	);
};

const StyledExternalLink = styled(ExternalLink)`
	margin-left: auto;
`;

const StyledLinkIcon = styled(Svg)`
	width: 14px;
	height: 14px;
	color: ${(props) => props.theme.colors.blueberry};
	&:hover {
		color: ${(props) => props.theme.colors.goldColors.color1};
	}
`;

const StyledTable = styled(Table)`
	margin-top: 16px;
`;

const StyledTableHeader = styled.div`
	font-family: ${(props) => props.theme.fonts.bold};
	color: ${(props) => props.theme.colors.blueberry};
`;

const StyledOrderType = styled.div`
	color: ${(props) => props.theme.colors.white};
	display: flex;
	align-items: center;
`;

const StyledCurrencyKey = styled.span`
	color: ${(props) => props.theme.colors.white};
	padding-right: 10px;
`;

const StyledPrice = styled.span`
	color: ${(props) => props.theme.colors.silver};
`;

const TableNoResults = styled(GridDivCenteredRow)`
	padding: 50px 0;
	justify-content: center;
	background-color: ${(props) => props.theme.colors.elderberry};
	margin-top: -2px;
	justify-items: center;
	grid-gap: 10px;
`;

export default TradeHistory;
