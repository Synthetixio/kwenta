import { useTranslation, Trans } from 'react-i18next';
import { useContext, FC, useState, useMemo } from 'react';
import { AreaChart, XAxis, YAxis, Area, Tooltip } from 'recharts';
import isNumber from 'lodash/isNumber';
import get from 'lodash/get';
import styled, { css, ThemeContext } from 'styled-components';
import format from 'date-fns/format';
import { Svg } from 'react-optimized-image';
// import { useMediaQuery } from 'react-responsive';

import LoaderIcon from 'assets/svg/app/loader.svg';

import RechartsResponsiveContainer from 'components/RechartsResponsiveContainer';
import MarketClosureIcon from 'components/MarketClosureIcon';

import { AFTER_HOURS_SYNTHS, CurrencyKey, SYNTHS_MAP } from 'constants/currency';
import { PeriodLabel, PERIOD_LABELS_MAP, PERIOD_LABELS, PERIOD_IN_HOURS } from 'constants/period';

import ChangePercent from 'components/ChangePercent';

import {
	GridDivCenteredCol,
	GridDivCenteredRow,
	TextButton,
	FlexDivRowCentered,
	NoTextTransform,
	AbsoluteCenteredDiv,
} from 'styles/common';

import { formatCurrency } from 'utils/formatters/number';

import useHistoricalRatesQuery from 'queries/rates/useHistoricalRatesQuery';
import media from 'styles/media';

import { Side } from '../types';
import useSelectedPriceCurrency from 'hooks/useSelectedPriceCurrency';
import useMarketClosed from 'hooks/useMarketClosed';

type ChartCardProps = {
	side: Side;
	currencyKey: CurrencyKey | null;
	priceRate: number | null;
	className?: string;
	openAfterHoursModalCallback?: () => void;
	alignRight?: boolean;
};

const ChartCard: FC<ChartCardProps> = ({
	side,
	currencyKey,
	priceRate,
	openAfterHoursModalCallback,
	alignRight,
	...rest
}) => {
	const { t } = useTranslation();
	const [selectedPeriod, setSelectedPeriod] = useState<PeriodLabel>(PERIOD_LABELS_MAP.ONE_DAY);
	const { selectPriceCurrencyRate, selectedPriceCurrency } = useSelectedPriceCurrency();
	const { isMarketClosed, marketClosureReason } = useMarketClosed(currencyKey);

	const theme = useContext(ThemeContext);
	const [currentPrice, setCurrentPrice] = useState<number | null>(null);

	const historicalRates = useHistoricalRatesQuery(currencyKey, selectedPeriod.period);

	const isSUSD = currencyKey === SYNTHS_MAP.sUSD;

	const change = historicalRates.data?.change ?? null;
	// eslint-disable-next-line
	const rates = historicalRates.data?.rates ?? [];

	const isChangePositive = change != null && change >= 0;
	const chartColor = isChangePositive || isSUSD ? theme.colors.green : theme.colors.red;

	const price = currentPrice || priceRate;

	const showOverlayMessage = isMarketClosed;
	const showLoader = historicalRates.isLoading;
	const disabledInteraction = showLoader || showOverlayMessage;
	const noData =
		historicalRates.isSuccess && historicalRates.data && historicalRates.data.rates.length === 0;

	// const isMobile = useMediaQuery({ query: `(max-width: ${breakpoints.sm})` });

	let linearGradientId = `priceChartCardArea-${side}`;

	const fontStyle = {
		fontSize: '12px',
		fill: theme.colors.white,
		fontFamily: theme.fonts.mono,
	};

	const computedRates = useMemo(() => {
		if (selectPriceCurrencyRate != null) {
			return rates.map((rateData) => ({
				...rateData,
				rate: rateData.rate / selectPriceCurrencyRate,
			}));
		}
		return rates;
	}, [rates, selectPriceCurrencyRate]);

	const CustomTooltip = ({
		active,
		label,
		payload,
	}: {
		active: boolean;
		payload: [
			{
				value: number;
			}
		];
		label: Date;
	}) =>
		active && payload && payload[0] ? (
			<TooltipContentStyle>
				<LabelStyle>{format(label, 'do MMM yy | HH:mm')}</LabelStyle>
				<LabelStyle>
					{t('exchange.price-chart-card.tooltip.price')}{' '}
					<CurrencyPrice>
						{formatCurrency(selectedPriceCurrency.name, payload[0].value, {
							sign: selectedPriceCurrency.sign,
						})}
					</CurrencyPrice>
				</LabelStyle>
			</TooltipContentStyle>
		) : null;

	return (
		<Container {...rest}>
			<ChartHeader>
				<ChartHeaderTop
					{...{
						alignRight,
					}}
				>
					{currencyKey != null ? (
						<>
							<CurrencyLabel>
								<Trans
									i18nKey="common.currency.currency-price"
									values={{ currencyKey }}
									components={[<NoTextTransform />]}
								/>
							</CurrencyLabel>
							{price != null && (
								<CurrencyPrice>
									{formatCurrency(selectedPriceCurrency.name, price, {
										sign: selectedPriceCurrency.sign,
										// @TODO: each currency key should specify how many decimals to show
										minDecimals:
											currencyKey === SYNTHS_MAP.sKRW || currencyKey === SYNTHS_MAP.sJPY ? 4 : 2,
									})}
								</CurrencyPrice>
							)}
							{change != null && <ChangePercent value={change} />}
						</>
					) : (
						<CurrencyLabel>{t('common.price')}</CurrencyLabel>
					)}
				</ChartHeaderTop>
				{!isMarketClosed && (
					<Actions {...{ alignRight }}>
						{PERIOD_LABELS.map((period) => (
							<StyledTextButton
								key={period.value}
								isActive={period.value === selectedPeriod.value}
								onClick={() => setSelectedPeriod(period)}
							>
								{t(period.i18nLabel)}
							</StyledTextButton>
						))}
					</Actions>
				)}
			</ChartHeader>
			<ChartBody>
				<ChartData disabledInteraction={disabledInteraction}>
					<RechartsResponsiveContainer
						width="100%"
						height="100%"
						id={`rechartsResponsiveContainer-${side}-${currencyKey}`}
					>
						<AreaChart
							data={computedRates}
							margin={{ right: 0, bottom: 0, left: 0, top: 0 }}
							onMouseMove={(e: any) => {
								const currentRate = get(e, 'activePayload[0].payload.rate', null);
								if (currentRate) {
									setCurrentPrice(currentRate);
								} else {
									setCurrentPrice(null);
								}
							}}
							onMouseLeave={(e: any) => {
								setCurrentPrice(null);
							}}
						>
							<defs>
								<linearGradient id={linearGradientId} x1="0" y1="0" x2="0" y2="1">
									<stop offset="0%" stopColor={chartColor} stopOpacity={0.5} />
									<stop offset="100%" stopColor={chartColor} stopOpacity={0} />
								</linearGradient>
							</defs>
							<XAxis
								// @ts-ignore
								dx={-1}
								dy={10}
								minTickGap={20}
								dataKey="timestamp"
								allowDataOverflow={true}
								tick={fontStyle}
								axisLine={false}
								tickLine={false}
								tickFormatter={(val) => {
									if (!isNumber(val)) {
										return '';
									}
									const periodOverOneDay =
										selectedPeriod != null && selectedPeriod.value > PERIOD_IN_HOURS.ONE_DAY;

									return format(val, periodOverOneDay ? 'dd MMM' : 'h:mma');
								}}
							/>
							<YAxis
								// TODO: might need to adjust the width to make sure we do not trim the values...
								type="number"
								allowDataOverflow={true}
								domain={isSUSD ? ['dataMax', 'dataMax'] : ['auto', 'auto']}
								tick={fontStyle}
								orientation="right"
								axisLine={false}
								tickLine={false}
								tickFormatter={(val) =>
									formatCurrency(selectedPriceCurrency.name, val, {
										sign: selectedPriceCurrency.sign,
									})
								}
							/>
							<Area
								dataKey="rate"
								stroke={chartColor}
								dot={false}
								strokeWidth={2}
								fill={`url(#${linearGradientId})`}
								isAnimationActive={false}
							/>
							{currencyKey != null && !noData && (
								<Tooltip
									isAnimationActive={false}
									position={{
										y: 0,
									}}
									content={
										// @ts-ignore
										<CustomTooltip />
									}
								/>
							)}
						</AreaChart>
					</RechartsResponsiveContainer>
				</ChartData>
				<AbsoluteCenteredDiv>
					{showOverlayMessage ? (
						<OverlayMessage>
							<MarketClosureIcon marketClosureReason={marketClosureReason} />
							<OverlayMessageTitle>
								{t(`exchange.price-chart-card.overlay-messages.${marketClosureReason}.title`)}
							</OverlayMessageTitle>
							<OverlayMessageSubtitle>
								{openAfterHoursModalCallback != null &&
								AFTER_HOURS_SYNTHS.has(currencyKey ?? '') ? (
									<Trans
										i18nKey="exchange.price-chart-card.overlay-messages.market-closure.after-hours"
										values={{
											linkText: t('exchange.price-chart-card.overlay-messages.market-closure.here'),
										}}
										components={{
											linkTag: <LinkTag onClick={openAfterHoursModalCallback} />,
										}}
									/>
								) : (
									t(`exchange.price-chart-card.overlay-messages.${marketClosureReason}.subtitle`)
								)}
							</OverlayMessageSubtitle>
						</OverlayMessage>
					) : showLoader ? (
						<Svg src={LoaderIcon} />
					) : noData ? (
						<NoData>{t('exchange.price-chart-card.no-data')}</NoData>
					) : undefined}
				</AbsoluteCenteredDiv>
			</ChartBody>
		</Container>
	);
};

const Container = styled.div`
	width: 100%;
	position: relative;
	height: 300px;
`;

const ChartData = styled.div<{ disabledInteraction: boolean }>`
	width: 100%;
	height: 100%;
	position: relative;
	${(props) =>
		props.disabledInteraction &&
		css`
			pointer-events: none;
			opacity: 0.1;
		`};
`;

const LinkTag = styled.span`
	color: ${(props) => props.theme.colors.goldColors.color1};
	text-decoration: underline;
	&:hover {
		cursor: pointer;
	}
`;

const ChartHeader = styled.div`
	display: block;
	padding-bottom: 5px;
	position: relative;
	top: 6px;
`;

const ChartHeaderTop = styled(FlexDivRowCentered)<{ alignRight?: boolean }>`
	border-bottom: 1px solid #171a1d;
	justify-content: ${(props) => (props.alignRight ? 'flex-end' : 'flex-start')};
`;

const CurrencyLabel = styled.span`
	padding-right: 20px;
	font-size: 14px;
	text-transform: capitalize;
	color: ${(props) => props.theme.colors.white};
	font-family: ${(props) => props.theme.fonts.bold};
`;

const CurrencyPrice = styled.span`
	font-family: ${(props) => props.theme.fonts.mono};
	color: ${(props) => props.theme.colors.white};
	padding-right: 20px;
`;

const Actions = styled(GridDivCenteredCol)<{ alignRight?: boolean }>`
	grid-gap: 8px;
	justify-content: ${(props) => (props.alignRight ? 'flex-end' : 'flex-start')};

	${media.lessThan('sm')`
		overflow: auto;
		width: 70px;
	`}
`;

const ChartBody = styled.div`
	padding-top: 10px;
	height: 35vh;
`;

const StyledTextButton = styled(TextButton)<{ isActive: boolean }>`
	font-family: ${(props) => props.theme.fonts.bold};
	color: ${(props) => (props.isActive ? props.theme.colors.white : props.theme.colors.blueberry)};
	border-bottom: 2px solid
		${(props) => (props.isActive ? props.theme.colors.goldColors.color1 : 'transparent')};
	&:hover {
		color: ${(props) => props.theme.colors.white};
	}
`;

const TooltipContentStyle = styled.div`
	font-family: ${(props) => props.theme.fonts.regular};
	padding: 5px;
	border-radius: 4px;
	background-color: ${(props) => props.theme.colors.elderberry};
	text-align: left;
`;

const ItemStyle = styled.div`
	color: ${(props) => props.theme.colors.white};
	padding: 3px 5px;
`;

const LabelStyle = styled(ItemStyle)`
	text-transform: capitalize;
`;

const OverlayMessage = styled(GridDivCenteredRow)`
	justify-items: center;
	text-align: center;
`;

const OverlayMessageTitle = styled.div`
	font-family: ${(props) => props.theme.fonts.bold};
	color: ${(props) => props.theme.colors.white};
	font-size: 14px;
	padding-top: 10px;
	padding-bottom: 5px;
`;

const OverlayMessageSubtitle = styled.div`
	color: ${(props) => props.theme.colors.silver};
`;

const NoData = styled.div`
	font-size: 14px;
	color: ${(props) => props.theme.colors.white};
`;

export default ChartCard;
