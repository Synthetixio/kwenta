import { useState } from 'react';
import Head from 'next/head';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import Slider from 'react-slick';
import { Svg } from 'react-optimized-image';

import ArrowsIcon from 'assets/svg/app/arrows.svg';
import SingleChartIcon from 'assets/svg/app/single-chart.svg';
import DoubleChartIcon from 'assets/svg/app/double-chart.svg';

import AppLayout from 'sections/shared/Layout/AppLayout';

import { formatCurrency } from 'utils/formatters/number';

import media from 'styles/media';

import {
	FlexDiv,
	FlexDivColCentered,
	PageContent,
	MobileContainerMixin,
	SwapCurrenciesButton,
	FlexDivCol,
} from 'styles/common';

import { DesktopOnlyView, MobileOrTabletView } from 'components/Media';
import useExchange from 'sections/exchange/hooks/useExchange';

const ExchangePage = () => {
	const { t } = useTranslation();

	const {
		baseCurrencyKey,
		quoteCurrencyKey,
		inverseRate,
		quoteCurrencyCard,
		quotePriceChartCard,
		quoteMarketDetailsCard,
		baseCurrencyCard,
		baseMarketDetailsCard,
		basePriceChartCard,
		handleCurrencySwap,
		footerCard,
		combinedPriceChartCard,
	} = useExchange({
		showPriceCard: true,
		showMarketDetailsCard: true,
		footerCardAttached: false,
		routingEnabled: true,
		persistSelectedCurrencies: true,
		showNoSynthsCard: true,
	});

	const [isShowingSingleChart, setIsShowingSingleChart] = useState(true);
	const toggleIsShowingSingleChart = () => setIsShowingSingleChart((bool) => !bool);

	return (
		<>
			<Head>
				<title>
					{baseCurrencyKey != null && quoteCurrencyKey != null
						? t('exchange.page-title-currency-pair', {
								baseCurrencyKey,
								quoteCurrencyKey,
								rate: formatCurrency(quoteCurrencyKey, inverseRate, {
									currencyKey: quoteCurrencyKey,
								}),
						  })
						: t('exchange.page-title')}
				</title>
			</Head>
			<AppLayout>
				<StyledPageContent>
					<DesktopOnlyView>
						<DesktopContainer>
							<DesktopCardsContainer>
								<LeftCardContainer data-testid="left-side">{quoteCurrencyCard}</LeftCardContainer>
								<Spacer>
									<SwapCurrenciesButton onClick={handleCurrencySwap} data-testid="swap-btn">
										<Svg src={ArrowsIcon} />
									</SwapCurrenciesButton>
								</Spacer>
								<RightCardContainer data-testid="right-side">{baseCurrencyCard}</RightCardContainer>
							</DesktopCardsContainer>

							{footerCard}

							<ChartsTogglerContainer>
								<ChartsToggler onClick={toggleIsShowingSingleChart}>
									<ChartsTogglerText active={isShowingSingleChart}>
										{t('exchange.charts.single')}
									</ChartsTogglerText>
									{isShowingSingleChart ? (
										<Svg src={SingleChartIcon} />
									) : (
										<Svg src={DoubleChartIcon} />
									)}
									<ChartsTogglerText active={!isShowingSingleChart}>
										{t('exchange.charts.double')}
									</ChartsTogglerText>
								</ChartsToggler>
							</ChartsTogglerContainer>

							{isShowingSingleChart ? (
								combinedPriceChartCard
							) : (
								<DesktopCardsContainer>
									<LeftCardContainer data-testid="left-side">
										{quotePriceChartCard}
									</LeftCardContainer>
									<Spacer></Spacer>
									<RightCardContainer data-testid="right-side">
										{basePriceChartCard}
									</RightCardContainer>
								</DesktopCardsContainer>
							)}

							<DesktopCardsContainer>
								<LeftCardContainer data-testid="left-side">
									{quoteMarketDetailsCard}
								</LeftCardContainer>
								<Spacer></Spacer>
								<RightCardContainer data-testid="right-side">
									{baseMarketDetailsCard}
								</RightCardContainer>
							</DesktopCardsContainer>
						</DesktopContainer>
					</DesktopOnlyView>
					<MobileOrTabletView>
						<MobileContainer>
							{quoteCurrencyCard}
							<VerticalSpacer>
								<SwapCurrenciesButton onClick={handleCurrencySwap} data-testid="swap-btn">
									<Svg src={ArrowsIcon} />
								</SwapCurrenciesButton>
							</VerticalSpacer>
							{baseCurrencyCard}
							<SliderContainer>
								<Slider arrows={false} dots={false}>
									<SliderContent data-testid="left-side">
										{basePriceChartCard}
										<SliderContentSpacer />
										{baseMarketDetailsCard}
									</SliderContent>
									<SliderContent data-testid="right-side">
										{quotePriceChartCard}
										<SliderContentSpacer />
										{quoteMarketDetailsCard}
									</SliderContent>
								</Slider>
							</SliderContainer>
						</MobileContainer>
					</MobileOrTabletView>
				</StyledPageContent>
			</AppLayout>
		</>
	);
};

const StyledPageContent = styled(PageContent)`
	${media.greaterThan('md')`
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		padding-bottom: 40px;
		padding-top: 55px;
	`}

	.currency-card {
		width: 312px;
		${media.lessThan('md')`
		width: 100%;
	`}
	}

	.market-details-card {
		max-width: 618px;
		width: 100%;
		${media.lessThan('md')`
		max-width: unset;
	`}
	}
`;

const DesktopContainer = styled(FlexDivCol)``;

const DesktopCardsContainer = styled(FlexDiv)`
	align-items: flex-start;
	justify-content: center;
	padding-bottom: 24px;
`;

const Spacer = styled.div`
	padding: 0 16px;
	align-self: flex-start;
	margin-top: 43px;
`;

const CardContainerMixin = `
	display: grid;
	grid-gap: 24px;
	width: 100%;
`;

const LeftCardContainer = styled.div`
	${CardContainerMixin};
	justify-items: right;
`;

const RightCardContainer = styled.div`
	${CardContainerMixin};
	justify-items: left;
`;

const MobileContainer = styled(FlexDivColCentered)`
	${MobileContainerMixin};
`;

const VerticalSpacer = styled.div`
	height: 2px;
	position: relative;
	${SwapCurrenciesButton} {
		position: absolute;
		transform: translate(-50%, -50%) rotate(90deg);
		border: 2px solid ${(props) => props.theme.colors.black};
	}
`;

const SliderContainer = styled.div`
	padding: 16px 0;
	width: 100%;
	* {
		outline: none;
	}
`;

const SliderContent = styled.div``;

const SliderContentSpacer = styled.div`
	height: 16px;
`;

const ChartsTogglerContainer = styled.div`
	position: relative;
	z-index: 1000;
`;

const ChartsToggler = styled.div`
	position: absolute;
	left: calc(50% - 50px);
	width: 135px;
	height: 20px;
	border-radius: 5px;
	cursor: pointer;
	display: flex;
	justify-content: space-between;
	align-items: center;
	background: ${(props) => props.theme.colors.black};
`;

const ChartsTogglerText = styled.div<{ active: boolean }>`
	text-transform: uppercase;
	color: ${(props) => (props.active ? props.theme.colors.white : props.theme.colors.silver)};
`;

export default ExchangePage;
