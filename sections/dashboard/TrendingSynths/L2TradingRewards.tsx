import { FC } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { Svg } from 'react-optimized-image';

import Button from 'components/Button';
import InfoIcon from 'assets/svg/app/info.svg';
import { CardTitle } from 'sections/dashboard/common';
import { FlexDivCol, FlexDivRowCentered, numericValueCSS } from 'styles/common';

const L2TradingRewards: FC = () => {
	const { t } = useTranslation();

	const isClaimRewardsDisabled = true;
	const onClaimRewards = () => {};

	return (
		<Container>
			<Heading>
				{t('l2-trading-incentives.dashboard.title')} <Svg src={InfoIcon} />
			</Heading>

			<RewardsCard>
				<FlexDivCol>
					<Title>{t('l2-trading-incentives.dashboard.potential-rewards')}</Title>
					<Amount>200 SNX</Amount>
				</FlexDivCol>
			</RewardsCard>

			<RewardsCard>
				<FlexDivCol>
					<Title>{t('l2-trading-incentives.dashboard.claimable-rewards')}</Title>
					<Amount>100 SNX</Amount>
				</FlexDivCol>

				<ClaimRewardsButton
					variant="primary"
					isRounded={true}
					disabled={isClaimRewardsDisabled}
					onClick={onClaimRewards}
					size="lg"
					data-testid="submit-order"
				>
					{t('l2-trading-incentives.dashboard.claim')}
				</ClaimRewardsButton>
			</RewardsCard>

			<LineItem>
				<LineItemLabel>{t('l2-trading-incentives.dashboard.epoch')}</LineItemLabel>
				<LineItemValue>07:14:55</LineItemValue>
			</LineItem>
			<LineItem>
				<LineItemLabel>{t('exchange.summary-info.gas-price-gwei')}</LineItemLabel>
				<LineItemValue>-</LineItemValue>
			</LineItem>
		</Container>
	);
};

export default L2TradingRewards;

const Container = styled.div`
	margin-bottom: 16px;
`;

const RewardsCard = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 9px 16px;
	background: ${(props) => props.theme.colors.navy};
	border-radius: 4px;
	margin: 8px 0;
`;

const Title = styled.div`
	font-size: 12px;
	color: ${(props) => props.theme.colors.silver};
`;

const Amount = styled.div`
	font-size: 16px;
	font-family: ${(props) => props.theme.fonts.bold};
	color: ${(props) => props.theme.colors.white};
`;

const Heading = styled(CardTitle)`
	display: flex;
	align-items: center;
	grid-gap: 5px;
`;

const ClaimRewardsButton = styled(Button)`
	width: 64px;
	height: 24px;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 0;
	font-size: 12px;
`;

const LineItem = styled(FlexDivRowCentered)`
	border-bottom: 0.5px solid ${(props) => props.theme.colors.navy};
	height: 40px;
`;

const LineItemLabel = styled.div`
	text-transform: capitalize;
	color: ${(props) => props.theme.colors.blueberry};
`;

const LineItemValue = styled.div`
	color: ${(props) => props.theme.colors.white};
	${numericValueCSS};
`;
