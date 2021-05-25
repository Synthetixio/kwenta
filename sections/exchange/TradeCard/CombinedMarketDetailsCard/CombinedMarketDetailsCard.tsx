import { useTranslation } from 'react-i18next';
import { FC } from 'react';
import styled from 'styled-components';

import { CurrencyKey } from 'constants/currency';
import { NO_VALUE } from 'constants/placeholder';
import { PERIOD_LABELS_MAP } from 'constants/period';
import { FlexDivRowCentered } from 'styles/common';
import { formatCurrency } from 'utils/formatters/number';
import { DesktopOnlyView, MobileOrTabletView } from 'components/Media';
import Card from 'components/Card';
import useCombinedRates from 'sections/exchange/hooks/useCombinedRates';

// import useHistoricalVolumeQuery from 'queries/rates/useHistoricalVolumeQuery';
// import useHistoricalRatesQuery from 'queries/rates/useHistoricalRatesQuery';
// import useSynthMarketCapQuery from 'queries/rates/useSynthMarketCapQuery';

// import synthetix from 'lib/synthetix';
// import useSelectedPriceCurrency from 'hooks/useSelectedPriceCurrency';

type MarketDetailsCardProps = {
	baseCurrencyKey: CurrencyKey | null;
	quoteCurrencyKey: CurrencyKey | null;
	basePriceRate: number | null;
	quotePriceRate: number | null;
	className?: string;
};

const MarketDetailsCard: FC<MarketDetailsCardProps> = ({
	baseCurrencyKey,
	quoteCurrencyKey,
	basePriceRate,
	quotePriceRate,
	...rest
}) => {
	const { t } = useTranslation();
	const pairCurrencyName = `${quoteCurrencyKey}/${baseCurrencyKey}`;

	const { low: rates24Low, high: rates24High } = useCombinedRates({
		baseCurrencyKey,
		quoteCurrencyKey,
		basePriceRate,
		quotePriceRate,
		selectedPeriod: PERIOD_LABELS_MAP.ONE_DAY,
	});

	// const {
	// 	selectPriceCurrencyRate,
	// 	selectedPriceCurrency,
	// 	getPriceAtCurrentRate,
	// } = useSelectedPriceCurrency();

	// const vol24HQuery = useHistoricalVolumeQuery(Period.ONE_DAY);
	// const historicalRates24HQuery = useHistoricalRatesQuery(currencyKey, Period.ONE_DAY);
	// const synthMarketCapQuery = useSynthMarketCapQuery(currencyKey);

	// let marketCap = synthMarketCapQuery.isSuccess ? synthMarketCapQuery.data ?? null : null;
	// let rates24High = historicalRates24HQuery.isSuccess
	// 	? historicalRates24HQuery.data?.high ?? null
	// 	: null;
	// let rates24Low = historicalRates24HQuery.isSuccess
	// 	? historicalRates24HQuery.data?.low ?? null
	// 	: null;
	// let volume24H =
	// 	vol24HQuery.isSuccess && currencyKey != null
	// 		? (vol24HQuery.data && vol24HQuery.data[currencyKey]) ?? null
	// 		: null;

	let marketCap = 0;
	let volume24H = 0;

	// if (rates24High) {
	// 	rates24High /= priceCurrencyRate;
	// }
	// if (rates24Low) {
	// 	rates24Low /= priceCurrencyRate;
	// }
	// if (volume24H) {
	// 	volume24H = getPriceAtCurrentRate(volume24H);
	// }
	// if (marketCap) {
	// 	marketCap = getPriceAtCurrentRate(marketCap);
	// }

	const volume24HItem = (
		<Item>
			<Label>{t('exchange.market-details-card.24h-vol')}</Label>
			<Value>
				{volume24H != null ? formatCurrency(pairCurrencyName, volume24H, {}) : NO_VALUE}
			</Value>
		</Item>
	);

	const rates24HighItem = (
		<Item>
			<Label>{t('exchange.market-details-card.24h-high')}</Label>
			<Value>
				{rates24High != null
					? `${formatCurrency(pairCurrencyName, rates24High, {
							minDecimals: 4,
					  })}`
					: NO_VALUE}
			</Value>
		</Item>
	);

	const marketCapItem = (
		<Item>
			<Label>{t('exchange.market-details-card.market-cap')}</Label>
			<Value>
				{marketCap != null ? formatCurrency(pairCurrencyName, marketCap, {}) : NO_VALUE}
			</Value>
		</Item>
	);

	const rates24HLowItem = (
		<Item>
			<Label>{t('exchange.market-details-card.24h-low')}</Label>
			<Value>
				{rates24Low != null
					? `${formatCurrency(pairCurrencyName, rates24Low, {
							minDecimals: 4,
					  })}`
					: NO_VALUE}
			</Value>
		</Item>
	);

	return (
		<Card className="market-details-card" {...rest}>
			<StyledCardHeader>{t('exchange.market-details-card.title')}</StyledCardHeader>
			<DesktopOnlyView>
				<StyledCardBody>
					<Column>
						{volume24HItem}
						{rates24HighItem}
					</Column>
					<Column>
						{marketCapItem}
						{rates24HLowItem}
					</Column>
				</StyledCardBody>
			</DesktopOnlyView>
			<MobileOrTabletView>
				<StyledCardBody>
					<Column>
						{volume24HItem}
						{marketCapItem}
						{rates24HighItem}
						{rates24HLowItem}
					</Column>
				</StyledCardBody>
			</MobileOrTabletView>
		</Card>
	);
};

const StyledCardBody = styled(Card.Body)`
	display: grid;
	grid-gap: 40px;
	grid-auto-flow: column;
	padding: 8px 18px;
`;

const StyledCardHeader = styled(Card.Header)`
	height: 40px;
`;

const Item = styled(FlexDivRowCentered)`
	border-bottom: 1px solid ${(props) => props.theme.colors.navy};
	padding: 8px 0;
`;

const Column = styled.div`
	${Item}:last-child {
		border-bottom: 0;
	}
`;

const Label = styled.div`
	text-transform: capitalize;
`;

const Value = styled.div`
	color: ${(props) => props.theme.colors.white};
	font-family: ${(props) => props.theme.fonts.mono};
`;

export default MarketDetailsCard;
