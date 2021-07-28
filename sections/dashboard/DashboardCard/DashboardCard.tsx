import { FC, useMemo } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/router';
import castArray from 'lodash/castArray';

import ROUTES from 'constants/routes';

import { TabList, TabPanel, TabButton } from 'components/Tab';
import Currency from 'components/Currency';
import Loader from 'components/Loader';

import SynthBalances from 'sections/dashboard/SynthBalances';
import Transactions from 'sections/dashboard/Transactions';
import CurrencyConvertCard from 'sections/dashboard/CurrencyConvertCard';

import { BoldText } from 'styles/common';

import { CardTitle, ConvertContainer } from '../common';
import FeeReclaimingSynths from '../FeeReclaimingSynths';

import useSelectedPriceCurrency from 'hooks/useSelectedPriceCurrency';
import { zeroBN } from 'utils/formatters/number';
import { isL2State } from 'store/wallet';
import useSynthetixQueries from '@synthetixio/queries';
import { walletAddressState } from 'store/wallet';
import { useRecoilValue } from 'recoil';
import { CurrencyKey } from 'constants/currency';

enum Tab {
	SynthBalances = 'synth-balances',
	Convert = 'convert',
	Transactions = 'transactions',
}

const Tabs = Object.values(Tab);

const DashboardCard: FC = () => {
	const { t } = useTranslation();
	const router = useRouter();
	const isL2 = useRecoilValue(isL2State);

	const { useExchangeRatesQuery, useSynthsBalancesQuery } = useSynthetixQueries();

	const tabQuery = useMemo(() => {
		if (router.query.tab) {
			const tab = castArray(router.query.tab)[0] as Tab;
			if (Tabs.includes(tab)) {
				return tab;
			}
		}
		return null;
	}, [router.query]);

	const walletAddress = useRecoilValue(walletAddressState);

	const { selectPriceCurrencyRate, selectedPriceCurrency } = useSelectedPriceCurrency();
	const exchangeRatesQuery = useExchangeRatesQuery();
	const synthsBalancesQuery = useSynthsBalancesQuery(walletAddress);

	const exchangeRates = exchangeRatesQuery.isSuccess ? exchangeRatesQuery.data ?? null : null;
	const synthBalances =
		synthsBalancesQuery.isSuccess && synthsBalancesQuery.data != null
			? synthsBalancesQuery.data
			: null;

	const activeTab =
		tabQuery != null
			? tabQuery
			: synthBalances?.balances.length || isL2
			? Tab.SynthBalances
			: Tab.Convert;

	const TABS = useMemo(
		() => [
			{
				name: Tab.SynthBalances,
				label: t('dashboard.tabs.nav.synth-balances'),
				active: activeTab === Tab.SynthBalances,
				onClick: () => router.push(ROUTES.Dashboard.SynthBalances),
			},
			...(!isL2
				? [
						{
							name: Tab.Convert,
							label: t('dashboard.tabs.nav.convert'),
							active: activeTab === Tab.Convert,
							onClick: () => router.push(ROUTES.Dashboard.Convert),
						},
				  ]
				: []),
			{
				name: Tab.Transactions,
				label: t('dashboard.tabs.nav.transactions'),
				active: activeTab === Tab.Transactions,
				onClick: () => router.push(ROUTES.Dashboard.Transactions),
			},
		],
		[t, activeTab, router, isL2]
	);

	if (synthsBalancesQuery.isLoading) {
		return <Loader />;
	}

	return (
		<>
			<Totals>
				<PortfolioCardTitle>{t('dashboard.your-portfolio.title')}</PortfolioCardTitle>
				<PortfolioCard>
					<StyledCurrencyPrice
						currencyKey={selectedPriceCurrency.name as CurrencyKey}
						price={synthBalances?.totalUSDBalance ?? 0}
						conversionRate={selectPriceCurrencyRate}
						sign={selectedPriceCurrency.sign}
					/>
					<Title>{t('common.totals.total-synth-value')}</Title>
				</PortfolioCard>
			</Totals>
			<FeeReclaimingSynths />
			<StyledTabList>
				{TABS.map(({ name, label, active, onClick }) => (
					<TabButton key={name} name={name} active={active} onClick={onClick}>
						{label}
					</TabButton>
				))}
			</StyledTabList>
			<TabPanel name={Tab.SynthBalances} activeTab={activeTab}>
				<SynthBalances
					balances={synthBalances?.balances ?? []}
					totalUSDBalance={synthBalances?.totalUSDBalance ?? zeroBN}
					exchangeRates={exchangeRates}
				/>
			</TabPanel>
			<TabPanel name={Tab.Convert} activeTab={activeTab}>
				<ConvertContainer>
					<CurrencyConvertCard />
				</ConvertContainer>
			</TabPanel>
			<TabPanel name={Tab.Transactions} activeTab={activeTab}>
				<Transactions />
			</TabPanel>
		</>
	);
};

const PortfolioCardTitle = styled(CardTitle)`
	margin-bottom: 12px;
	border-bottom: 1px solid ${(props) => props.theme.colors.navy};
	padding-bottom: 5px;
`;

const PortfolioCard = styled.div`
	font-family: ${(props) => props.theme.fonts.mono};
	border-radius: 4px;
	background-color: ${(props) => props.theme.colors.elderberry};
	padding: 24px;
	display: grid;
	grid-gap: 10px;
	justify-items: center;
`;

const Title = styled(BoldText)`
	text-transform: uppercase;
`;

const StyledCurrencyPrice = styled(Currency.Price)`
	font-size: 20px;
	color: ${(props) => props.theme.colors.white};
`;

const StyledTabList = styled(TabList)`
	margin-bottom: 12px;
`;

const Totals = styled.div`
	padding-bottom: 30px;
`;

export default DashboardCard;
