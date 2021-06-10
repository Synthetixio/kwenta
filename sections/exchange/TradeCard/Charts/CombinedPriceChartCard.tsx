import { useContext, FC, useState, useMemo } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import isNumber from 'lodash/isNumber';
import get from 'lodash/get';
import styled, { ThemeContext } from 'styled-components';
import format from 'date-fns/format';
import { Svg } from 'react-optimized-image';

import LoaderIcon from 'assets/svg/app/loader.svg';
import { PERIOD_LABELS, PERIOD_IN_HOURS } from 'constants/period';
import { CurrencyKey } from 'constants/currency';
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
	CurrencyLabelWithDot,
	PriceDot,
	CompareRatioToggle,
	CompareRatioToggleType,
} from './common/styles';
import OverlayMessageContainer from './common/OverlayMessage';
import { ChartType } from 'constants/chartType';
import AreaChart, { getMinNoOfDecimals } from './CombinedPriceChartCard/AreaChart';
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

	const [currentPrice, setCurrentPrice] = useState<number | null>(null);
	const price = currentPrice || (basePriceRate ?? 1) / (quotePriceRate! || 1);

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
						<CurrencyLabel>{t('common.price')}</CurrencyLabel>
					) : isCompareChart ? (
						<>
							<CurrencyLabelWithDot>
								<Trans
									i18nKey="common.currency.currency-price"
									values={{ currencyKey: baseCurrencyKey }}
									components={[<NoTextTransform />]}
								/>
								<PriceDot color={'#395BC5'} />
							</CurrencyLabelWithDot>
							<CurrencyLabelWithDot>
								<Trans
									i18nKey="common.currency.currency-price"
									values={{ currencyKey: quoteCurrencyKey }}
									components={[<NoTextTransform />]}
								/>
								<PriceDot color={'#7AC09F'} />
							</CurrencyLabelWithDot>
						</>
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
								quoteCurrencyKey,
								baseCurrencyKey,
								selectedPeriod,
								changes,
								change,
								setCurrentPrice,
								noData,
							}}
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
