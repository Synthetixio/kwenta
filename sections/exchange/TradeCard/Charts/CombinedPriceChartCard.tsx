import { useContext, FC, useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { AreaChart, XAxis, YAxis, Area, Tooltip } from 'recharts';
import isNumber from 'lodash/isNumber';
import get from 'lodash/get';
import styled, { ThemeContext } from 'styled-components';
import format from 'date-fns/format';
import { Svg } from 'react-optimized-image';

import LoaderIcon from 'assets/svg/app/loader.svg';
import RechartsResponsiveContainer from 'components/RechartsResponsiveContainer';
import MarketClosureIcon from 'components/MarketClosureIcon';
import { PERIOD_LABELS, PERIOD_IN_HOURS } from 'constants/period';
import {
	AFTER_HOURS_SYNTHS,
	COMMODITY_SYNTHS,
	CurrencyKey,
	FIAT_SYNTHS,
	LSE_SYNTHS,
	TSE_SYNTHS,
} from 'constants/currency';
import { chartPeriodState } from 'store/app';
import usePersistedRecoilState from 'hooks/usePersistedRecoilState';
import ChangePercent from 'components/ChangePercent';
import { FlexDivRowCentered, NoTextTransform, AbsoluteCenteredDiv, FlexDiv } from 'styles/common';
import { formatNumber } from 'utils/formatters/number';
import useMarketClosed from 'hooks/useMarketClosed';
import useMarketHoursTimer from 'sections/exchange/hooks/useMarketHoursTimer';
import marketNextOpen from 'utils/marketNextOpen';
import useCombinedRates from 'sections/exchange/hooks/useCombinedRates';
import {
	ChartData,
	LinkTag,
	CurrencyLabel,
	CurrencyPrice,
	Actions,
	ChartBody,
	StyledTextButton,
	TooltipContentStyle,
	LabelStyle,
	OverlayMessage,
	OverlayMessageTitle,
	OverlayMessageSubtitle,
	OverlayTimer,
	NoData,
} from './common';
import { DesktopOnlyView, MobileOnlyView } from 'components/Media';

type ChartCardProps = {
	baseCurrencyKey: CurrencyKey | null;
	quoteCurrencyKey: CurrencyKey | null;
	basePriceRate: number | null;
	quotePriceRate: number | null;
	className?: string;
	openAfterHoursModalCallback?: () => void;
};

const ChartCard: FC<ChartCardProps> = ({
	baseCurrencyKey,
	quoteCurrencyKey,
	basePriceRate,
	quotePriceRate,
	openAfterHoursModalCallback,
	...rest
}) => {
	const { t } = useTranslation();
	const [selectedPeriod, setSelectedPeriod] = usePersistedRecoilState(chartPeriodState);
	const baseTimer = useMarketHoursTimer(marketNextOpen(baseCurrencyKey ?? '') ?? null);
	const quoteTimer = useMarketHoursTimer(marketNextOpen(quoteCurrencyKey ?? '') ?? null);
	const { changes, noData, change, isLoadingRates } = useCombinedRates({
		baseCurrencyKey,
		quoteCurrencyKey,
		selectedPeriod,
	});
	const {
		isMarketClosed: isBaseMarketClosed,
		marketClosureReason: baseMarketClosureReason,
	} = useMarketClosed(baseCurrencyKey);
	const {
		isMarketClosed: isQuoteMarketClosed,
		marketClosureReason: quoteMarketClosureReason,
	} = useMarketClosed(quoteCurrencyKey);

	const isMarketClosed = isBaseMarketClosed || isQuoteMarketClosed;
	const marketClosureReason = baseMarketClosureReason || quoteMarketClosureReason;
	const timer = baseTimer || quoteTimer;

	const theme = useContext(ThemeContext);
	const [currentPrice, setCurrentPrice] = useState<number | null>(null);

	const isChangePositive = change != null && change >= 0;
	const chartColor = isChangePositive ? theme.colors.green : theme.colors.red;

	const containsMarketsInAfterHours =
		AFTER_HOURS_SYNTHS.has(baseCurrencyKey ?? '') || AFTER_HOURS_SYNTHS.has(quoteCurrencyKey ?? '');

	const containsClosedMarkets =
		containsMarketsInAfterHours ||
		TSE_SYNTHS.has(baseCurrencyKey ?? '') ||
		TSE_SYNTHS.has(quoteCurrencyKey ?? '') ||
		LSE_SYNTHS.has(baseCurrencyKey ?? '') ||
		LSE_SYNTHS.has(quoteCurrencyKey ?? '') ||
		FIAT_SYNTHS.has(baseCurrencyKey ?? '') ||
		FIAT_SYNTHS.has(quoteCurrencyKey ?? '') ||
		COMMODITY_SYNTHS.has(baseCurrencyKey ?? '') ||
		COMMODITY_SYNTHS.has(quoteCurrencyKey ?? '');

	const price = currentPrice || (basePriceRate ?? 1 / quotePriceRate! ?? 1);

	const showOverlayMessage = isMarketClosed;
	const showLoader = isLoadingRates;
	const disabledInteraction = showLoader || showOverlayMessage;

	let linearGradientId = `priceChartCardArea`;

	const fontStyle = {
		fontSize: '12px',
		fill: theme.colors.white,
		fontFamily: theme.fonts.mono,
	};

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
					<CurrencyPrice>{formatNumber(payload[0].value, {})}</CurrencyPrice>
				</LabelStyle>
			</TooltipContentStyle>
		) : null;

	return (
		<Container {...rest}>
			<ChartHeader>
				<FlexDivRowCentered>
					{baseCurrencyKey && quoteCurrencyKey ? (
						<>
							<FlexDiv>
								<DesktopOnlyView>
									<CurrencyLabel>
										<Trans
											i18nKey="common.currency.currency-price"
											values={{ currencyKey: `${baseCurrencyKey}/${quoteCurrencyKey}` }}
											components={[<NoTextTransform />]}
										/>
									</CurrencyLabel>
								</DesktopOnlyView>
								<MobileOnlyView>
									<CurrencyLabel>{`${baseCurrencyKey}/${quoteCurrencyKey}`}</CurrencyLabel>
								</MobileOnlyView>
							</FlexDiv>
							{price != null && (
								<FlexDiv>
									<CurrencyPrice>
										{formatNumber(price, {
											minDecimals: 4,
										})}
									</CurrencyPrice>
								</FlexDiv>
							)}
							{change != null && <ChangePercent value={change} />}
						</>
					) : (
						<CurrencyLabel>{t('common.price')}</CurrencyLabel>
					)}
				</FlexDivRowCentered>
				{!isMarketClosed && (
					<Actions>
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
						id={`rechartsResponsiveContainer-${baseCurrencyKey}/${quoteCurrencyKey}`}
					>
						<AreaChart
							data={changes}
							margin={{ right: 0, bottom: 0, left: 0, top: 0 }}
							onMouseMove={(e: any) => {
								const currentRate = get(e, 'activePayload[0].payload.change', null);
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
								domain={['auto', 'auto']}
								tick={fontStyle}
								orientation="right"
								axisLine={false}
								tickLine={false}
								tickFormatter={(val) => formatNumber(val, {})}
							/>
							<Area
								dataKey="change"
								stroke={chartColor}
								dot={false}
								strokeWidth={2}
								fill={`url(#${linearGradientId})`}
								isAnimationActive={false}
							/>
							{baseCurrencyKey && quoteCurrencyKey && !noData && (
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
								{openAfterHoursModalCallback != null && containsMarketsInAfterHours && (
									<>
										<Trans
											i18nKey="exchange.price-chart-card.overlay-messages.market-closure.after-hours"
											values={{
												linkText: t(
													'exchange.price-chart-card.overlay-messages.market-closure.here'
												),
											}}
											components={{
												linkTag: <LinkTag onClick={openAfterHoursModalCallback} />,
											}}
										/>
									</>
								)}
							</OverlayMessageSubtitle>
							{marketClosureReason === 'market-closure' && containsClosedMarkets ? (
								<>
									<OverlayMessageSubtitle>Market reopens in: </OverlayMessageSubtitle>
									<OverlayTimer>{timer}</OverlayTimer>
								</>
							) : (
								<OverlayMessageSubtitle>
									{t(`exchange.price-chart-card.overlay-messages.${marketClosureReason}.subtitle`)}
								</OverlayMessageSubtitle>
							)}
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
	position: relative;
`;

const ChartHeader = styled(FlexDivRowCentered)`
	border-bottom: 1px solid #171a1d;
	padding-bottom: 5px;
`;

export default ChartCard;
