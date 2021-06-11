import { FC, useState, useMemo, useCallback } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import styled from 'styled-components';
import { Svg } from 'react-optimized-image';

import { CurrencyKey, SYNTHS_MAP } from 'constants/currency';
import { Period, PERIOD_LABELS_MAP, PERIOD_LABELS } from 'constants/period';
import { ChartType } from 'constants/chartType';

import ChangePercent from 'components/ChangePercent';
import { chartPeriodState, baseChartTypeState, quoteChartTypeState } from 'store/app';
import usePersistedRecoilState from 'hooks/usePersistedRecoilState';
import { FlexDivRowCentered, NoTextTransform, AbsoluteCenteredDiv } from 'styles/common';
import { formatCurrency } from 'utils/formatters/number';

import useSelectedPriceCurrency from 'hooks/useSelectedPriceCurrency';
import useMarketClosed from 'hooks/useMarketClosed';
import LoaderIcon from 'assets/svg/app/loader.svg';

import CandlestickChart from './Types/CandlesticksChart';
import CompareChart from './Types/CompareChart';
import AreaChartData from './Types/AreaChart';

import ChartTypeToggle from './ChartTypeToggle';
import OverlayMessageContainer from './common/OverlayMessage';
import CurrencyPricePlaceHolder from './common/CurrencyPricePlaceHolder';
import CurrencyLabelsWithDots from './common/CurrencyLabelsWithDots';
import {
	ChartData,
	CurrencyLabel,
	CurrencyPrice,
	Actions,
	PeriodSelector,
	ChartBody,
	StyledTextButton,
	NoData,
	OverlayMessage,
	CompareRatioToggle,
	CompareRatioToggleType,
	CompareRatioToggleContainer,
} from './common/styles';
import { Side } from 'sections/exchange/TradeCard/types';
import useAreaChartData from './hooks/useAreaChartData';
import useCandleSticksChartData from './hooks/useCandleSticksChartData';

type ChartCardProps = {
	side: Side;
	currencyKey: CurrencyKey | null;
	otherCurrencyKey: CurrencyKey | null;
	priceRate: number | null;
	className?: string;
	openAfterHoursModalCallback?: () => void;
	alignRight?: boolean;
};

const ChartCard: FC<ChartCardProps> = ({
	side,
	currencyKey,
	otherCurrencyKey,
	priceRate,
	openAfterHoursModalCallback,
	alignRight,
	...rest
}) => {
	const { t } = useTranslation();
	const [selectedPeriod, setSelectedPeriod] = usePersistedRecoilState<Period>(chartPeriodState);
	const selectedPeriodLabel = useMemo(() => PERIOD_LABELS_MAP[selectedPeriod], [selectedPeriod]);

	const [selectedBaseChartType, setSelectedBaseChartType] = usePersistedRecoilState<ChartType>(
		baseChartTypeState
	);
	const [selectedQuoteChartType, setSelectedQuoteChartType] = usePersistedRecoilState<ChartType>(
		quoteChartTypeState
	);
	const { selectPriceCurrencyRate, selectedPriceCurrency } = useSelectedPriceCurrency();
	const { isMarketClosed, marketClosureReason } = useMarketClosed(currencyKey);

	const {
		noData: noAreaChartData,
		isLoading: isLoadingAreaChartData,
		change,
		rates,
	} = useAreaChartData({ currencyKey, selectedPeriodLabel });
	const {
		noData: noCandleSticksChartData,
		isLoading: isLoadingCandleSticksChartData,
		data: candleSticksChartData,
	} = useCandleSticksChartData({ currencyKey, selectedPeriodLabel });

	const [currentPrice, setCurrentPrice] = useState<number | null>(null);
	const price = currentPrice || priceRate;

	const showOverlayMessage = isMarketClosed;
	const showLoader = isLoadingAreaChartData || isLoadingCandleSticksChartData;
	const disabledInteraction = showLoader || showOverlayMessage;
	const isSUSD = currencyKey === SYNTHS_MAP.sUSD;
	const eitherCurrencyIsSUSD = useMemo(() => isSUSD || otherCurrencyKey === SYNTHS_MAP.sUSD, [
		isSUSD,
		otherCurrencyKey,
	]);

	const selectedChartType = useMemo(
		() => (side === 'base' ? selectedBaseChartType : selectedQuoteChartType),
		[side, selectedBaseChartType, selectedQuoteChartType]
	);
	const noData =
		(selectedChartType === ChartType.AREA && noAreaChartData && !isSUSD) ||
		(selectedChartType === ChartType.CANDLESTICK && noCandleSticksChartData && !isSUSD);

	const setSelectedChartType = useCallback(
		(type: ChartType) => {
			(side === 'base' ? setSelectedBaseChartType : setSelectedQuoteChartType)(type);
		},
		[side, setSelectedBaseChartType, setSelectedQuoteChartType]
	);

	const isCompareChart = useMemo(() => selectedChartType === ChartType.COMPARE, [
		selectedChartType,
	]);

	const computedRates = useMemo(() => {
		return rates.map(({ timestamp, rate }) => ({
			timestamp,
			value: !selectPriceCurrencyRate ? rate : rate / selectPriceCurrencyRate,
		}));
	}, [rates, selectPriceCurrencyRate]);

	return (
		<Container {...rest}>
			<ChartHeader>
				<ChartHeaderTop
					{...{
						alignRight,
					}}
				>
					{!currencyKey ? (
						<CurrencyPricePlaceHolder />
					) : isCompareChart ? (
						<CurrencyLabelsWithDots
							baseCurrencyKey={currencyKey}
							quoteCurrencyKey={otherCurrencyKey}
						/>
					) : (
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
					)}
				</ChartHeaderTop>
				{!isMarketClosed && (
					<Actions reverseChildren={alignRight}>
						<PeriodSelector>
							{PERIOD_LABELS.map((period) => (
								<StyledTextButton
									key={period.period}
									isActive={period.period === selectedPeriod}
									onClick={(event) => {
										setSelectedPeriod(period.period);
										if (
											period.period !== Period.ONE_MONTH &&
											selectedChartType === ChartType.CANDLESTICK
										) {
											// candlesticks type is only available on monthly view
											setSelectedChartType(ChartType.AREA);
										}
									}}
								>
									{t(period.i18nLabel)}
								</StyledTextButton>
							))}
						</PeriodSelector>
						{selectedPeriod === Period.ONE_MONTH && (
							<ChartTypeToggle
								chartTypes={[ChartType.AREA, ChartType.CANDLESTICK]}
								selectedChartType={selectedChartType}
								setSelectedChartType={setSelectedChartType}
								alignRight={alignRight}
							/>
						)}
						{eitherCurrencyIsSUSD ? null : (
							<CompareRatioToggleContainer>
								<CompareRatioToggle>
									<CompareRatioToggleType
										onClick={() => {
											setSelectedChartType(ChartType.COMPARE);
										}}
										isActive={isCompareChart}
									>
										{t('common.chart-types.compare')}
									</CompareRatioToggleType>
									<CompareRatioToggleType
										onClick={() => {
											setSelectedChartType(ChartType.AREA);
										}}
										isActive={!isCompareChart}
									>
										{t('common.chart-types.ratio')}
									</CompareRatioToggleType>
								</CompareRatioToggle>
							</CompareRatioToggleContainer>
						)}
					</Actions>
				)}
			</ChartHeader>
			<ChartBody>
				<ChartData disabledInteraction={disabledInteraction}>
					{isCompareChart ? (
						<CompareChart
							baseCurrencyKey={currencyKey}
							quoteCurrencyKey={otherCurrencyKey}
							{...{ selectedPeriodLabel }}
						/>
					) : selectedChartType === ChartType.AREA ? (
						<AreaChartData
							{...{
								selectedPeriodLabel,
								change,
								side,
								setCurrentPrice,
							}}
							data={computedRates}
							noData={!isSUSD && noAreaChartData}
							{...(isSUSD ? { yAxisDomain: ['dataMax', 'dataMax'] } : {})}
							yAxisTickFormatter={(val: number) =>
								formatCurrency(selectedPriceCurrency.name, val, {
									sign: selectedPriceCurrency.sign,
								})
							}
							tooltipPriceFormatter={(n: number) =>
								formatCurrency(selectedPriceCurrency.name, n, {
									sign: selectedPriceCurrency.sign,
								})
							}
							linearGradientId={`price-chart-card-area-${currencyKey}`}
						/>
					) : (
						<CandlestickChart
							data={candleSticksChartData}
							{...{ selectedPeriodLabel, selectedPriceCurrency }}
						/>
					)}
				</ChartData>
				<AbsoluteCenteredDiv>
					{showOverlayMessage ? (
						<OverlayMessage>
							<OverlayMessageContainer
								{...{
									marketClosureReason,
									currencyKey: currencyKey!,
									openAfterHoursModalCallback,
								}}
							/>
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
	padding-bottom: 5px;
	grid-gap: 20px;
`;

export default ChartCard;
