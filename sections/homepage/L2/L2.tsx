import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';
import Img, { Svg } from 'react-optimized-image';

import SlippageIcon from 'assets/svg/marketing/icon-slippage.svg';
import InfiniteLiquidityIcon from 'assets/svg/marketing/icon-infinite-liquidity.svg';
import FuturesIcon from 'assets/svg/marketing/icon-futures.svg';

import {
	FlexDiv,
	FlexDivCentered,
	FlexDivCol,
	FlexDivColCentered,
	FlexDivRow,
} from 'styles/common';

import { Copy, FlexSection, GridContainer, LeftSubHeader, Title } from '../common';
import media from 'styles/media';
import Button from 'components/Button';

import Optimism from 'assets/svg/marketing/OPTIMISM-R.svg';
import LINKIcon from 'assets/svg/currencies/crypto/LINK.svg';
import ETHIcon from 'assets/svg/currencies/crypto/ETH.svg';
import USDIcon from 'assets/svg/currencies/fiat/USD.svg';
import BTCIcon from 'assets/svg/currencies/crypto/BTC.svg';

const FEATURES = [
	{
		id: 'infinite-liquidity',
		title: 'homepage.features.infinite-liquidity.title',
		copy: 'homepage.features.infinite-liquidity.copy',
		image: <Img src={InfiniteLiquidityIcon} alt="" />,
	},
	{
		id: 'zero-slippage',
		title: 'homepage.features.zero-slippage.title',
		copy: 'homepage.features.zero-slippage.copy',
		image: <Img src={SlippageIcon} alt="" />,
	},
	{
		id: 'synthetic-futures',
		title: 'homepage.features.synthetic-futures.title',
		copy: 'homepage.features.synthetic-futures.copy',
		image: <Img src={FuturesIcon} alt="" />,
		comingSoon: true,
	},
];

const L2 = () => {
	const { t } = useTranslation();

	return (
		<Container>
			<FlexSection>
				<div>
				<FlexDivCol>
						<p>Powered by</p>
						<Img src={Optimism} width={138}/>
						</FlexDivCol>
				<StyledGridContainer>
						
						<FeatureCard>
							<Golden>10</Golden>
							<FeatureContentTitle>
								<Title>Transactions per second</Title>
							</FeatureContentTitle>
						</FeatureCard>
				</StyledGridContainer>
				</div>
				<FlexDivCol>
					<StyledLeftSubHeader>{t('homepage.l2.title')}</StyledLeftSubHeader>
					<Copy>
						<Trans i18nKey={'homepage.l2.copy'} components={[<Emphasis />]} />
					</Copy>
					<FlexDiv>
						<Button variant={'outline'}>{t('homepage.l2.cta-buttons.learn-more')}</Button>
						<Button variant={'primary'}>{t('homepage.l2.cta-buttons.switch-l2')}</Button>
					</FlexDiv>
				</FlexDivCol>
			</FlexSection>
			<FlexSection>
				<FlexDivCol>
					<StyledLeftSubHeader>{t('homepage.l2.markets.title')}</StyledLeftSubHeader>
					<Copy>{t('homepage.l2.markets.copy')}</Copy>
				</FlexDivCol>
				<StyledGridContainer>
					<FlexDivColCentered>
						<Img src={LINKIcon} height={50} />
						<Copy>sLINK</Copy>
					</FlexDivColCentered>
					<FlexDivColCentered>
						<Img src={ETHIcon} height={50} />
						<Copy>sETH</Copy>
					</FlexDivColCentered>
					<FlexDivColCentered>
						<Img src={USDIcon} height={50} />
						<Copy>sUSD</Copy>
					</FlexDivColCentered>
					<FlexDivColCentered>
						<Img src={BTCIcon} height={50} />
						<Copy>sBTC</Copy>
					</FlexDivColCentered>
				</StyledGridContainer>
			</FlexSection>
		</Container>
	);
};

const Golden = styled.p`
	font-size: 55px;
	font-weight: 700;
	background: ${props => props.theme.colors.gold};
	background-clip: text;
	text-fill-color: transparent;
	background-size: 100%;
    -webkit-background-clip: text;
    -moz-background-clip: text;
    -webkit-text-fill-color: transparent; 
    -moz-text-fill-color: transparent;
`;

const Emphasis = styled.b`
	color: ${(props) => props.theme.colors.white};
`;

const StyledGridContainer = styled(GridContainer)`
	${media.lessThan('lg')`
		grid-template-columns: repeat(4, auto);
	`}
	${media.lessThan('md')`
		grid-template-columns: auto;
	`}
`;

const Container = styled.div`
	padding-bottom: 240px;
	${media.lessThan('lg')`
		padding-bottom: 140px;
	`}
`;

const StyledLeftSubHeader = styled(LeftSubHeader)`
	max-width: 500px;
	padding-top: 80px;
	${media.lessThan('lg')`
		padding-top: 0;
		padding-bottom: 56px;
	`}
`;

const FeatureCard = styled(FlexDivCol)`
	margin-bottom: 16px;
`;

const FeatureIconContainer = styled.div`
	padding-bottom: 40px;
	img {
		width: 64px;
		height: 64px;
	}
`;

const FeatureContentTitle = styled(FlexDivCentered)`
	padding-bottom: 14px;
`;

const ComingSoonTag = styled(FlexDivCentered)`
	width: 104px;
	height: 24px;
	background: ${(props) => props.theme.colors.gold};
	border-radius: 50px;
	color: ${(props) => props.theme.colors.white};
	font-family: ${(props) => props.theme.fonts.bold};
	justify-content: center;
	margin-left: 16px;
`;

export default L2;
