import { FC } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import Wei from '@synthetixio/wei';

import Currency from 'components/Currency';
import ProgressBar from 'components/ProgressBar';

import { Period } from 'constants/period';

import useSynthetixQueries, { Rates, SynthBalance } from '@synthetixio/queries';

import { formatPercent } from 'utils/formatters/number';

import media from 'styles/media';
import { GridDivCentered } from 'styles/common';
import useSelectedPriceCurrency from 'hooks/useSelectedPriceCurrency';
import Connector from 'containers/Connector';

export type SynthBalanceRowProps = {
	exchangeRates: Rates | null;
	synth: SynthBalance;
	totalUSDBalance: Wei;
};

const SynthBalanceRow: FC<SynthBalanceRowProps> = ({ exchangeRates, synth, totalUSDBalance }) => {
	const { t } = useTranslation();
	const { selectPriceCurrencyRate, selectedPriceCurrency } = useSelectedPriceCurrency();

	const { synthsMap } = Connector.useContainer();

	const { useHistoricalRatesQuery } = useSynthetixQueries();

	const currencyKey = synth.currencyKey;
	const percent = synth.usdBalance.div(totalUSDBalance).toNumber();

	const synthDesc = synthsMap != null ? synthsMap[synth.currencyKey]?.description : '';

	const totalValue = synth.usdBalance;
	const price = exchangeRates && exchangeRates[synth.currencyKey];
	const historicalRates = useHistoricalRatesQuery(currencyKey, Period.ONE_DAY);

	return (
		<>
			<Container>
				<div>
					<Currency.Name
						currencyKey={currencyKey}
						name={t('common.currency.synthetic-currency-name', { currencyName: synthDesc })}
						showIcon={true}
					/>
				</div>
				<AmountCol>
					<Currency.Amount
						currencyKey={currencyKey}
						amount={synth.balance}
						totalValue={totalValue}
						sign={selectedPriceCurrency.sign}
						conversionRate={selectPriceCurrencyRate}
						formatAmountOptions={{ minDecimals: 4 }}
						formatTotalValueOptions={{ minDecimals: 2 }}
					/>
				</AmountCol>
				<ExchangeRateCol>
					{price != null && (
						<Currency.Price
							currencyKey={currencyKey}
							price={price}
							sign={selectedPriceCurrency.sign}
							conversionRate={selectPriceCurrencyRate}
							change={historicalRates.data?.change}
						/>
					)}
				</ExchangeRateCol>
				<SynthBalancePercentRow>
					<ProgressBar percentage={percent} />
					<TypeDataSmall>{formatPercent(percent)}</TypeDataSmall>
				</SynthBalancePercentRow>
			</Container>
		</>
	);
};

const Container = styled.div`
	background: ${(props) => props.theme.colors.elderberry};
	padding: 12px 22px 12px 16px;
	margin-top: 2px;
	display: grid;
	grid-gap: 20px;
	justify-content: space-between;
	align-items: center;
	grid-template-columns: repeat(4, minmax(80px, 150px));
	${media.lessThan('md')`
		grid-template-columns: auto auto;
	`}
`;

const AmountCol = styled.div`
	justify-self: flex-end;
`;

const SynthBalancePercentRow = styled.div`
	${media.lessThan('md')`
		display: none;
	`}
`;

const ExchangeRateCol = styled.div`
	justify-self: flex-end;
	${media.lessThan('md')`
		display: none;
	`}
`;

const TypeDataSmall = styled.div`
	font-family: ${(props) => props.theme.fonts.mono};
	margin-top: 5px;
`;

export const NoBalancesContainer = styled(GridDivCentered)`
	width: 100%;
	border-radius: 4px;
	grid-template-columns: 1fr auto;
	background-color: ${(props) => props.theme.colors.elderberry};
	padding: 16px 32px;
	margin: 0 auto;
	${media.lessThan('md')`
		justify-items: center;
		grid-template-columns: unset;
		grid-gap: 30px;
	`}
`;

export const Message = styled.div`
	color: ${(props) => props.theme.colors.white};
	font-size: 14px;
	font-family: ${(props) => props.theme.fonts.bold};
	flex-grow: 1;
	text-align: center;
`;

export default SynthBalanceRow;
