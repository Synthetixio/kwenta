import { FC } from 'react';
import styled from 'styled-components';
import BigNumber from 'bignumber.js';
import { Trans, useTranslation } from 'react-i18next';
import add from 'date-fns/add';

import media from 'styles/media';
import Currency from 'components/Currency';
import useSelectedPriceCurrency from 'hooks/useSelectedPriceCurrency';
import { formatCurrency, toBigNumber, zeroBN } from 'utils/formatters/number';
import { SYNTHS_MAP } from 'constants/currency';
import Countdown, { zeroPad } from 'react-countdown';
import { NoTextTransform } from 'styles/common';

const PriceAdjustingTrade: FC = () => {
	const { t } = useTranslation();
	const { selectPriceCurrencyRate, selectedPriceCurrency } = useSelectedPriceCurrency();

	const fromCurrencyKey = 'sETH';
	const toCurrencyKey = 'sLINK';
	const initialPrice = toBigNumber('13.77');
	const adjustedPrice = toBigNumber('15.48');
	const change = adjustedPrice.minus(initialPrice);
	const adjustmentEndDate = add(new Date(), { seconds: 1000 });

	return (
		<Container>
			<ColorLine />
			<Currency.Icon currencyKey={toCurrencyKey} width="24px" height="24px" />
			<Col>
				<MainColTitle>
					<Trans
						i18nKey="dashboard.price-adjusting-trades.row.main-col-title"
						values={{ fromCurrencyKey, toCurrencyKey }}
						components={[<NoTextTransform />, <NoTextTransform />]}
					/>
				</MainColTitle>
				<MainColSubtitle>
					{t('dashboard.price-adjusting-trades.row.main-col-subtitle')}
				</MainColSubtitle>
			</Col>
			<Col>
				<ColTitle>
					<Currency.Price
						currencyKey={SYNTHS_MAP.sUSD}
						price={initialPrice}
						sign={selectedPriceCurrency.sign}
						conversionRate={selectPriceCurrencyRate}
					/>
				</ColTitle>
				<ColSubtitle>{t('dashboard.price-adjusting-trades.row.col-initial-price')}</ColSubtitle>
			</Col>
			<Col>
				<ColTitle>
					<Currency.Price
						currencyKey={SYNTHS_MAP.sUSD}
						price={adjustedPrice}
						sign={selectedPriceCurrency.sign}
						conversionRate={selectPriceCurrencyRate}
					/>
				</ColTitle>
				<ColSubtitle>{t('dashboard.price-adjusting-trades.row.col-adjusted-price')}</ColSubtitle>
			</Col>
			<Col>
				<ColTitle>
					<ChangePercent value={change} />
				</ColTitle>
				<ColSubtitle>{t('dashboard.price-adjusting-trades.row.col-debt-surplus')}</ColSubtitle>
			</Col>
			<Col>
				<ColTitle>
					<Countdown
						date={adjustmentEndDate}
						renderer={({ minutes, seconds }) => {
							const duration = [
								`${zeroPad(minutes)}${t('common.time.minutes')}`,
								`${zeroPad(seconds)}${t('common.time.seconds')}`,
							];

							return <span>{duration.join(':')}</span>;
						}}
					/>
				</ColTitle>
				<ColSubtitle>{t('dashboard.price-adjusting-trades.row.col-remaining')}</ColSubtitle>
			</Col>
		</Container>
	);
};

const ChangePercent: FC<{ value: BigNumber }> = ({ value }) => {
	const { selectedPriceCurrency } = useSelectedPriceCurrency();
	return (
		<CurrencyChange isPositive={value.gte(zeroBN)}>
			{formatCurrency(SYNTHS_MAP.sUSD, value, {
				sign: selectedPriceCurrency.sign,
			})}
		</CurrencyChange>
	);
};

const CurrencyChange = styled.span<{ isPositive: boolean }>`
	display: inline-flex;
	align-items: center;
	color: ${(props) => (props.isPositive ? props.theme.colors.green : props.theme.colors.red)};
	font-family: ${(props) => props.theme.fonts.mono};
`;

const Container = styled.div`
	background: ${(props) => props.theme.colors.elderberry};
	padding: 12px 16px;
	margin-top: 2px;
	display: grid;
	align-items: center;
	grid-gap: 14px;
	grid-template-columns: 4px 24px 2fr 1fr 1fr 1fr 1fr;
	${media.lessThan('md')`
		grid-template-columns: auto auto;
	`}
`;

const ColorLine = styled.div`
	width: 4px;
	height: 40px;
	background: ${(props) => props.theme.colors.yellow};
`;

const Col = styled.div`
	display: flex;
	flex-direction: column;
	justify-content: space-between;
`;

const ColTitle = styled.div`
	color: ${(props) => props.theme.colors.white};
	font-family: ${(props) => props.theme.fonts.mono};
`;

const ColSubtitle = styled.div`
	font-family: ${(props) => props.theme.fonts.bold};
`;

const MainColTitle = styled(ColTitle)`
	font-family: ${(props) => props.theme.fonts.bold};
	font-size: 14px;
`;

const MainColSubtitle = styled(ColSubtitle)``;

export default PriceAdjustingTrade;
