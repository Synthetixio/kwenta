import { FC } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';

import { Synth } from '@synthetixio/contracts-interface';

import Currency from 'components/Currency';

import { NO_VALUE } from 'constants/placeholder';

import { SelectableCurrencyRow } from 'styles/common';
import { Period } from 'constants/period';
import useMarketClosed from 'hooks/useMarketClosed';
import useSelectedPriceCurrency from 'hooks/useSelectedPriceCurrency';
import useSynthetixQueries from '@synthetixio/queries';
import { CurrencyKey } from 'constants/currency';

type SynthRowProps = {
	price: number | null;
	synth: Synth;
	onClick: () => void;
};
const SynthRow: FC<SynthRowProps> = ({ price, synth, onClick }) => {
	const { t } = useTranslation();
	const { selectPriceCurrencyRate, selectedPriceCurrency } = useSelectedPriceCurrency();

	const { useHistoricalRatesQuery } = useSynthetixQueries();

	const currencyKey = synth.name as CurrencyKey;

	const historicalRates = useHistoricalRatesQuery(currencyKey, Period.ONE_DAY);
	const { marketClosureReason } = useMarketClosed(currencyKey);

	return (
		<StyledSelectableCurrencyRow key={currencyKey} onClick={onClick} isSelectable={true}>
			<Currency.Name
				name={t('common.currency.synthetic-currency-name', {
					currencyName: synth.description,
				})}
				showIcon={true}
				{...{ currencyKey, marketClosureReason }}
			/>
			{price != null ? (
				<Currency.Price
					sign={selectedPriceCurrency.sign}
					conversionRate={selectPriceCurrencyRate}
					change={historicalRates.data?.change}
					{...{ price, currencyKey }}
				/>
			) : (
				NO_VALUE
			)}
		</StyledSelectableCurrencyRow>
	);
};

const StyledSelectableCurrencyRow = styled(SelectableCurrencyRow)`
	padding: 5px 16px;
`;

export default SynthRow;
