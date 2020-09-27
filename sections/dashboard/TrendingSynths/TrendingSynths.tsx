import { useState } from 'react';
import styled from 'styled-components';
import synthetix, { Synth } from 'lib/synthetix';
import { useRecoilValue } from 'recoil';
import { useTranslation } from 'react-i18next';
import { priceCurrencyState } from 'store/app';

import Currency from 'components/Currency';
import Select from 'components/Select';
import useExchangeRatesQuery, { Rates } from 'queries/rates/useExchangeRatesQuery';
import { NO_VALUE } from 'constants/placeholder';
import { CardTitle } from 'sections/dashboard/common';
import { SelectableCurrencyRow, FlexDivRow } from 'styles/common';
import useSynthExchangesSinceQuery from 'queries/rates/useSynthExchangesSinceQuery';
import { getVolume } from 'queries/rates/utils';
import {
	HistoricalRatesBySynth,
	useHistoricalRatesListQuery,
} from 'queries/rates/useHistoricalRatesQuery';
import { Period } from 'constants/period';

const TrendingSynths = () => {
	const { t } = useTranslation();
	const SYNTH_SORT_OPTIONS = [
		{ label: t('dashboard.synthSort.price'), value: 'PRICE' },
		{ label: t('dashboard.synthSort.change'), value: 'CHANGE' },
		{ label: t('dashboard.synthSort.low'), value: 'LOW' },
		{ label: t('dashboard.synthSort.high'), value: 'HIGH' },
		{ label: t('dashboard.synthSort.volume'), value: 'VOLUME' },
	];

	const [currentSynthSort, setCurrentSynthSort] = useState(SYNTH_SORT_OPTIONS[0]);
	const synths = synthetix.js?.synths ?? [];

	const exchangeRatesQuery = useExchangeRatesQuery({ refetchInterval: false });
	const synthExchangesQuery = useSynthExchangesSinceQuery();
	const historicalRatesQuery = useHistoricalRatesListQuery(synths, Period.ONE_DAY);
	const synthExchanges = synthExchangesQuery.data || [];
	const historicalRates = !!historicalRatesQuery.data
		? historicalRatesQuery.data
		: synths.reduce((acc, synth: Synth) => {
				acc[synth.name] = {
					rates: [],
					change: 0,
					low: 0,
					high: 0,
				};
				return acc;
		  }, {} as HistoricalRatesBySynth);

	const synthVolumeMap = synths.reduce((synthMap: any, synth: Synth) => {
		synthMap[synth.name] = getVolume(synthExchanges, synth.name);
		return synthMap;
	}, {});

	const selectedPriceCurrency = useRecoilValue(priceCurrencyState);
	const selectPriceCurrencyRate =
		exchangeRatesQuery.data && exchangeRatesQuery.data[selectedPriceCurrency.name];

	const sortComparator = getSort(
		currentSynthSort.value,
		exchangeRatesQuery.data || ({} as Rates),
		synthVolumeMap || {},
		historicalRates
	);

	return (
		<>
			<Container>
				<FlexDivRow>
					<CardTitle>{t('dashboard.trending')}</CardTitle>
					<TrendingSortSelect
						formatOptionLabel={(option: any) => <span>{option.label}</span>}
						options={SYNTH_SORT_OPTIONS}
						value={currentSynthSort}
						onChange={(option: any) => {
							if (option) {
								setCurrentSynthSort(option);
							}
						}}
					/>
				</FlexDivRow>
			</Container>
			<Rows>
				{synths.sort(sortComparator).map((synth: Synth) => {
					const price = exchangeRatesQuery.data && exchangeRatesQuery.data[synth.name];
					const currencyKey = synth.name;

					return (
						<StyledSelectableCurrencyRow key={currencyKey} isSelectable={false}>
							<Currency.Name
								currencyKey={currencyKey}
								name={t('common.currency.synthetic-currency-name', {
									currencyName: synth.description,
								})}
								showIcon={true}
							/>
							{price != null ? (
								<Currency.Price
									currencyKey={selectedPriceCurrency.name}
									price={price}
									sign={selectedPriceCurrency.sign}
									conversionRate={selectPriceCurrencyRate}
								/>
							) : (
								NO_VALUE
							)}
						</StyledSelectableCurrencyRow>
					);
				})}
			</Rows>
		</>
	);
};

const getSort = (
	sort: string,
	exchangeRates: Rates,
	volumeMap: { [key: string]: number },
	historicalRates: HistoricalRatesBySynth
) => {
	switch (sort) {
		case 'CHANGE':
			return changeSort(historicalRates);
		case 'LOW':
			return lowSort(historicalRates);
		case 'HIGH':
			return highSort(historicalRates);
		case 'VOLUME':
			return volumeSort(volumeMap);
		case 'PRICE':
		default:
			return priceSort(exchangeRates);
	}
};

const priceSort = (exchangeRates: Rates) => (a: Synth, b: Synth) => {
	const priceA = exchangeRates[a.name];
	const priceB = exchangeRates[b.name];

	return priceA > priceB ? -1 : 1;
};

const changeSort = (historicalRates: HistoricalRatesBySynth) => (a: Synth, b: Synth) => {
	const { change: changeA } = historicalRates[a.name];
	const { change: changeB } = historicalRates[b.name];

	return changeA > changeB ? -1 : 1;
};

const lowSort = (historicalRates: HistoricalRatesBySynth) => (a: Synth, b: Synth) => {
	const { low: lowA } = historicalRates[a.name];
	const { low: lowB } = historicalRates[b.name];

	return lowA > lowB ? -1 : 1;
};

const highSort = (historicalRates: HistoricalRatesBySynth) => (a: Synth, b: Synth) => {
	const { high: highA } = historicalRates[a.name];
	const { high: highB } = historicalRates[b.name];

	return highA > highB ? -1 : 1;
};

const volumeSort = (volumeMap: { [key: string]: number }) => (a: Synth, b: Synth) => {
	const volumeA = volumeMap[a.name];
	const volumeB = volumeMap[b.name];

	return volumeA > volumeB ? -1 : 1;
};

const Container = styled.div`
	padding: 0 32px;
`;

const Rows = styled.div`
	overflow: auto;
`;

const StyledSelectableCurrencyRow = styled(SelectableCurrencyRow)`
	padding-left: 32px;
	padding-right: 32px;
`;

const TrendingSortSelect = styled(Select)`
	width: 30%;
`;

export default TrendingSynths;
