import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { Svg } from 'react-optimized-image';

import BalancerIcon from 'assets/svg/app/market-closure/balancer.svg';
import ArrowsIcon from 'assets/svg/app/arrows.svg';
import useBalancerExchange from 'sections/exchange/hooks/useBalancerExchange';
import { SwapCurrenciesButton, FlexDivRowCentered } from 'styles/common';
import media from 'styles/media';
import { SYNTHS_MAP } from 'constants/currency';

import { CenteredModal } from '../common';

type BalancerTradeModalProps = {
	onDismiss: () => void;
};

const BalancerTradeModal: FC<BalancerTradeModalProps> = ({ onDismiss }) => {
	const { t } = useTranslation();

	const {
		quoteCurrencyCard,
		baseCurrencyCard,
		handleCurrencySwap,
		footerCard,
	} = useBalancerExchange({
		defaultBaseCurrencyKey: SYNTHS_MAP.iBNB,
		defaultQuoteCurrencyKey: SYNTHS_MAP.sUSD,
		footerCardAttached: true,
		persistSelectedCurrencies: true,
		showNoSynthsCard: true,
	});

	return (
		<StyledCenteredModal
			onDismiss={onDismiss}
			isOpen={true}
			title={t('modals.afterHours.title', { synth: SYNTHS_MAP.sTSLA })}
			lowercase={true}
		>
			<NoticeText>{t('modals.afterHours.notice-text', { synth: SYNTHS_MAP.sTSLA })}</NoticeText>
			{quoteCurrencyCard}
			<VerticalSpacer>
				<SwapCurrenciesButton onClick={handleCurrencySwap} data-testid="swap-btn">
					<Svg src={ArrowsIcon} />
				</SwapCurrenciesButton>
			</VerticalSpacer>
			{baseCurrencyCard}
			{footerCard}
			<PoweredBySection>
				<div>{t('modals.afterHours.powered-by-balancer')}</div>
				<BalancerImg alt="" src={BalancerIcon.src} width="20px" height="25px" />
			</PoweredBySection>
		</StyledCenteredModal>
	);
};

const StyledCenteredModal = styled(CenteredModal)`
	.currency-card {
		width: 312px;
		${media.lessThan('md')`
	width: 100%;
	`}
	}
	.card {
		background-color: ${(props) => props.theme.colors.vampire};
		width: 400px;
		margin: 0 auto;
		padding: 0 20px;
	}
`;

const VerticalSpacer = styled.div`
	height: 2px;
	position: relative;
	margin: 0 auto;
	${SwapCurrenciesButton} {
		position: absolute;
		transform: translate(-50%, -50%) rotate(90deg);
		border: 2px solid ${(props) => props.theme.colors.black};
	}
`;

const NoticeText = styled.div`
	color: ${(props) => props.theme.colors.silver};
	text-align: center;
	padding: 15px 20px 10px 20px;
`;

const PoweredBySection = styled(FlexDivRowCentered)`
	margin: 15px auto;
	text-align: center;
	color: ${(props) => props.theme.colors.silver};
	width: 150px;
`;

const BalancerImg = styled.img`
	margin-left: 8px;
`;

export default BalancerTradeModal;
