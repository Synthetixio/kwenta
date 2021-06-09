import { FC, useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import styled from 'styled-components';
import { Svg } from 'react-optimized-image';

import { CurrencyKey, SYNTHS_MAP } from 'constants/currency';
import { PERIOD_LABELS, Period } from 'constants/period';
import { ChartType } from 'constants/chartType';

import ChangePercent from 'components/ChangePercent';
import { chartPeriodState } from 'store/app';
import usePersistedRecoilState from 'hooks/usePersistedRecoilState';
import { FlexDiv, FlexDivRowCentered, NoTextTransform, AbsoluteCenteredDiv } from 'styles/common';
import { formatCurrency } from 'utils/formatters/number';

import useSelectedPriceCurrency from 'hooks/useSelectedPriceCurrency';
import useMarketClosed from 'hooks/useMarketClosed';
import LoaderIcon from 'assets/svg/app/loader.svg';

import CandlestickChart from './CandlesticksChart';
import CompareChart from './CompareChart';
import AreaChartData from './AreaChart';

import ChartTypeToggle from './ChartTypeToggle';
import OverlayMessageContainer from './common/OverlayMessage';
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
	const [selectedChartType, setSelectedChartType] = useState(ChartType.AREA);
	const [selectedPeriod, setSelectedPeriod] = usePersistedRecoilState(chartPeriodState);
	const { selectPriceCurrencyRate, selectedPriceCurrency } = useSelectedPriceCurrency();
	const { isMarketClosed, marketClosureReason } = useMarketClosed(currencyKey);

	const [currentPrice, setCurrentPrice] = useState<number | null>(null);

	const {
		noData: noAreaChartData,
		isLoading: isLoadingAreaChartData,
		change,
		rates,
	} = useAreaChartData({ currencyKey, selectedPeriod });
	const {
		noData: noCandleSticksChartData,
		isLoading: isLoadingCandleSticksChartData,
		data: candleSticksChartData,
	} = useCandleSticksChartData({ currencyKey, selectedPeriod });

	const price = currentPrice || priceRate;

	const showOverlayMessage = isMarketClosed;
	const showLoader = isLoadingAreaChartData || isLoadingCandleSticksChartData;
	const disabledInteraction = showLoader || showOverlayMessage;
	const noData = noAreaChartData || noCandleSticksChartData;

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
					<Actions reverseChildren={alignRight}>
						<PeriodSelector>
							{PERIOD_LABELS.map((period) => (
								<StyledTextButton
									key={period.value}
									isActive={period.value === selectedPeriod.value}
									onClick={(event) => {
										setSelectedPeriod(period);
										if (period.period !== Period.ONE_MONTH) {
											setSelectedChartType(ChartType.AREA);
										}
									}}
								>
									{t(period.i18nLabel)}
								</StyledTextButton>
							))}
						</PeriodSelector>
						<CompareRatioToggle>
							<CompareRatioToggleType
								onClick={() => {
									setSelectedChartType(ChartType.COMPARE);
								}}
								isActive={selectedChartType === ChartType.COMPARE}
							>
								{t('common.chart-types.compare')}
							</CompareRatioToggleType>
							<CompareRatioToggleType
								onClick={() => {
									setSelectedChartType(ChartType.AREA);
								}}
								isActive={selectedChartType !== ChartType.COMPARE}
							>
								{t('common.chart-types.ratio')}
							</CompareRatioToggleType>
						</CompareRatioToggle>
					</Actions>
				)}
			</ChartHeader>
			{selectedPeriod.period === Period.ONE_MONTH && (
				<ChartTypeToggle
					chartTypes={[ChartType.AREA, ChartType.CANDLESTICK]}
					selectedChartType={selectedChartType}
					setSelectedChartType={setSelectedChartType}
					alignRight={alignRight}
				/>
			)}
			<ChartBody>
				<ChartData disabledInteraction={disabledInteraction}>
					{selectedChartType === ChartType.COMPARE ? (
						<CompareChart
							baseCurrencyKey={currencyKey}
							quoteCurrencyKey={otherCurrencyKey}
							{...{ side, selectedPeriod }}
						/>
					) : selectedChartType === ChartType.AREA ? (
						<AreaChartData
							{...{
								currencyKey,
								selectedPeriod,
								selectedPriceCurrency,
								rates,
								change,
								selectPriceCurrencyRate,
								side,
								setCurrentPrice,
							}}
							noData={noAreaChartData}
						/>
					) : (
						<CandlestickChart
							data={candleSticksChartData}
							{...{ selectedPeriod, selectedPriceCurrency }}
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

const CompareRatioToggle = styled(FlexDiv)`
	grid-gap: 4px;
`;

const CompareRatioToggleType = styled.div<{ isActive: boolean }>`
	cursor: pointer;
	font-weight: bold;
	border-bottom: 2px solid ${(props) => (props.isActive ? '#b68b58' : 'transparent')};
	color: ${(props) => (props.isActive ? props.theme.colors.white : 'inherit')};
	text-transform: uppercase;
`;

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
`;

export default ChartCard;
