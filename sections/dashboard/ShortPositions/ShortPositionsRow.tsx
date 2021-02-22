import { FC } from 'react';
import styled from 'styled-components';
import synthetix from 'lib/synthetix';
import { useTranslation } from 'react-i18next';

import Currency from 'components/Currency';
import Button from 'components/Button';

import { Rates } from 'queries/rates/useExchangeRatesQuery';

import { formatPercent } from 'utils/formatters/number';

import media from 'styles/media';
import { GridDivCentered } from 'styles/common';
import useSelectedPriceCurrency from 'hooks/useSelectedPriceCurrency';
import { Short } from 'queries/short/types';

export type ShortPositionsRowProps = {
	exchangeRates: Rates | null;
	shortInfo: Short;
};

const ShortPositionsRow: FC<ShortPositionsRowProps> = ({ exchangeRates, shortInfo }) => {
	const { t } = useTranslation();
	const { selectPriceCurrencyRate, selectedPriceCurrency } = useSelectedPriceCurrency();

	const synthBorrowedKey = shortInfo.synthBorrowed;

	const synthDesc =
		synthetix.synthsMap != null ? synthetix.synthsMap[synthBorrowedKey]?.description : '';

	const totalValue = exchangeRates
		? shortInfo.synthBorrowedAmount * exchangeRates[synthBorrowedKey]
		: null;

	const collateralizationRatio = totalValue ? shortInfo.collateralLockedAmount / totalValue : '0';

	// currently not easily calculatable
	const profit = 0;
	const roi = 0;

	return (
		<>
			<Container>
				<div>
					<Currency.Name
						currencyKey={shortInfo.synthBorrowed}
						name={t('common.currency.synthetic-currency-name', { currencyName: synthDesc })}
						showIcon={true}
					/>
				</div>
				<AmountCol>
					<Currency.Amount
						currencyKey="sUSD"
						amount={shortInfo.synthBorrowedAmount}
						totalValue={totalValue || '...'}
						sign={selectedPriceCurrency.sign}
						conversionRate={selectPriceCurrencyRate}
					/>
				</AmountCol>
				<CollateralAmountCol>
					<Currency.Price
						currencyKey={synthBorrowedKey}
						price={shortInfo.collateralLockedAmount}
						sign={selectedPriceCurrency.sign}
						conversionRate={selectPriceCurrencyRate}
					/>
				</CollateralAmountCol>
				<CollateralizationRatioCol>
					<TypeDataSmall>{formatPercent(collateralizationRatio)}</TypeDataSmall>
				</CollateralizationRatioCol>
				<RoiCol>
					<Currency.Price
						currencyKey={synthBorrowedKey}
						price={profit}
						sign="$"
						conversionRate={selectPriceCurrencyRate}
						change={roi}
					/>
				</RoiCol>
				<ActionButtons>
					<Button variant="alt">{t('common.loans.adjust-collateral')}</Button>
					<Button variant="danger">{t('common.loans.close')}</Button>
				</ActionButtons>
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
	grid-template-columns: repeat(6, minmax(80px, 150px));
	${media.lessThan('md')`
		grid-template-columns: auto auto;
	`}
`;

const AmountCol = styled.div`
	justify-self: flex-start;
`;

const CollateralAmountCol = styled.div`
	justify-self: flex-end;
`;

const CollateralizationRatioCol = styled.div`
	justify-self: flex-end;
`;

const ActionButtons = styled.div`
	display: grid;
	grid-gap: 10px;
`;

const RoiCol = styled.div`
	justify-self: flex-end;
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

const TypeDataSmall = styled.div`
	color: ${(props) => props.theme.colors.white};
	font-family: ${(props) => props.theme.fonts.mono};
	margin-top: 5px;
`;

export default ShortPositionsRow;
