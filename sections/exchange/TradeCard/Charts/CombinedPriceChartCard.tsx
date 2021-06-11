import { FC, useState, useMemo } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import styled from 'styled-components';
import { Svg } from 'react-optimized-image';

import LoaderIcon from 'assets/svg/app/loader.svg';
import { PERIOD_LABELS } from 'constants/period';
import { CurrencyKey, SYNTHS_MAP } from 'constants/currency';
import { chartPeriodState } from 'store/app';
import usePersistedRecoilState from 'hooks/usePersistedRecoilState';
import ChangePercent from 'components/ChangePercent';
import {
	FlexDivRowCentered,
	NoTextTransform,
	AbsoluteCenteredDiv,
	FlexDiv,
	FlexDivCol,
} from 'styles/common';
import { formatNumber } from 'utils/formatters/number';
import useMarketClosed from 'hooks/useMarketClosed';
import useCombinedRates from 'sections/exchange/hooks/useCombinedRates';
import { DesktopOnlyView, MobileOnlyView } from 'components/Media';

import {
	ChartData,
	CurrencyLabel,
	CurrencyPrice,
	Actions,
	ChartBody,
	StyledTextButton,
	OverlayMessage,
	NoData,
	PeriodSelector,
	CompareRatioToggle,
	CompareRatioToggleType,
} from './common/styles';
import OverlayMessageContainer from './common/OverlayMessage';
import CurrencyPricePlaceHolder from './common/CurrencyPricePlaceHolder';
import CurrencyLabelsWithDots from './common/CurrencyLabelsWithDots';
import { ChartType } from 'constants/chartType';
import AreaChart from './Types/AreaChart';
import CompareChart from './Types/CompareChart';

type CombinedPriceChartCardProps = {
	baseCurrencyKey: CurrencyKey | null;
	quoteCurrencyKey: CurrencyKey | null;
	basePriceRate: number | null;
	quotePriceRate: number | null;
	className?: string;
	openAfterHoursModalCallback?: () => void;
};

const CombinedPriceChartCard: FC<CombinedPriceChartCardProps> = ({
	baseCurrencyKey,
	quoteCurrencyKey,
	basePriceRate,
	quotePriceRate,
	openAfterHoursModalCallback,
	...rest
}) => {
	const { t } = useTranslation();
	const [selectedChartType, setSelectedChartType] = useState(ChartType.AREA);
	const [selectedPeriod, setSelectedPeriod] = usePersistedRecoilState(chartPeriodState);
	const { data, noData, change, isLoadingRates } = useCombinedRates({
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

	const [currentPrice, setCurrentPrice] = useState<number | null>(null);
	const price = currentPrice || (basePriceRate ?? 1) / (quotePriceRate! || 1);

	const eitherCurrencyIsSUSD = useMemo(
		() => baseCurrencyKey === SYNTHS_MAP.sUSD || quoteCurrencyKey === SYNTHS_MAP.sUSD,
		[baseCurrencyKey, quoteCurrencyKey]
	);

	const showOverlayMessage = isMarketClosed;
	const showLoader = isLoadingRates;
	const disabledInteraction = showLoader || showOverlayMessage;

	const isCompareChart = useMemo(() => selectedChartType === ChartType.COMPARE, [
		selectedChartType,
	]);

	return (
		<Container {...rest}>
			<ChartHeader>
				<ChartHeaderInner>
					{!(baseCurrencyKey && quoteCurrencyKey) ? (
						<CurrencyPricePlaceHolder />
					) : isCompareChart ? (
						<CurrencyLabelsWithDots {...{ baseCurrencyKey, quoteCurrencyKey }} />
					) : (
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
											minDecimals: getMinNoOfDecimals(price),
										})}
									</CurrencyPrice>
								</FlexDiv>
							)}
							{change != null && <ChangePercent value={change} />}
						</>
					)}
				</ChartHeaderInner>
				{!isMarketClosed && (
					<Actions>
						{eitherCurrencyIsSUSD ? null : (
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
						)}
						<PeriodSelector>
							{PERIOD_LABELS.map((period) => (
								<StyledTextButton
									key={period.value}
									isActive={period.value === selectedPeriod.value}
									onClick={() => setSelectedPeriod(period)}
								>
									{t(period.i18nLabel)}
								</StyledTextButton>
							))}
						</PeriodSelector>
					</Actions>
				)}
			</ChartHeader>
			<ChartBody>
				<ChartData disabledInteraction={disabledInteraction}>
					{isCompareChart ? (
						<CompareChart {...{ baseCurrencyKey, quoteCurrencyKey, selectedPeriod }} />
					) : (
						<AreaChart
							{...{
								selectedPeriod,
								data,
								change,
								setCurrentPrice,
								noData,
							}}
							yAxisTickFormatter={(val: number) =>
								formatNumber(val, {
									minDecimals: getMinNoOfDecimals(val),
								})
							}
							tooltipPriceFormatter={(n: number) =>
								formatNumber(n, {
									minDecimals: getMinNoOfDecimals(n),
								})
							}
							linearGradientId={`price-chart-card-area-${baseCurrencyKey}-${quoteCurrencyKey}`}
						/>
					)}
				</ChartData>

				<AbsoluteCenteredDiv>
					{showOverlayMessage ? (
						<OverlayMessage>
							{isBaseMarketClosed && isQuoteMarketClosed ? (
								<BothMarketsClosedOverlayMessageContainer>
									<BothMarketsClosedOverlayMessageItem>
										<OverlayMessageContainer
											{...{
												marketClosureReason: quoteMarketClosureReason,
												currencyKey: quoteCurrencyKey!,
												openAfterHoursModalCallback,
											}}
										/>
									</BothMarketsClosedOverlayMessageItem>
									<BothMarketsClosedOverlayMessageItem>
										<OverlayMessageContainer
											{...{
												marketClosureReason: baseMarketClosureReason,
												currencyKey: baseCurrencyKey!,
												openAfterHoursModalCallback,
											}}
										/>
									</BothMarketsClosedOverlayMessageItem>
								</BothMarketsClosedOverlayMessageContainer>
							) : isBaseMarketClosed ? (
								<OverlayMessageContainer
									{...{
										marketClosureReason: baseMarketClosureReason,
										currencyKey: baseCurrencyKey!,
										openAfterHoursModalCallback,
									}}
								/>
							) : (
								<OverlayMessageContainer
									{...{
										marketClosureReason: quoteMarketClosureReason,
										currencyKey: quoteCurrencyKey!,
										openAfterHoursModalCallback,
									}}
								/>
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

function getMinNoOfDecimals(value: number): number {
	let decimals = 2;
	if (value < 1) {
		const [, afterDecimal] = value.toString().split('.'); // todo
		if (afterDecimal) {
			for (let i = 0; i < afterDecimal.length; i++) {
				const n = afterDecimal[i];
				if (parseInt(n) !== 0) {
					decimals = i + 3;
					break;
				}
			}
		}
	}
	return decimals;
}

const Container = styled.div`
	position: relative;
`;

const ChartHeader = styled(FlexDivRowCentered)`
	border-bottom: 1px solid #171a1d;
	padding-bottom: 5px;
`;

const BothMarketsClosedOverlayMessageContainer = styled(FlexDiv)`
	justify-content: space-around;
	grid-gap: 3rem;
`;

const BothMarketsClosedOverlayMessageItem = styled(FlexDivCol)`
	align-items: center;
`;

const ChartHeaderInner = styled(FlexDivRowCentered)`
	grid-gap: 20px;
`;

export default CombinedPriceChartCard;
