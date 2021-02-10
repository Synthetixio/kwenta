import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { Svg } from 'react-optimized-image';

import ArrowsIcon from 'assets/svg/app/arrows.svg';
import useBalancerExchange from 'sections/exchange/hooks/useBalancerExchange';
import { SwapCurrenciesButton } from 'styles/common';
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
		defaultBaseCurrencyKey: SYNTHS_MAP.sUSD,
		defaultQuoteCurrencyKey: SYNTHS_MAP.iBNB,
		footerCardAttached: true,
		persistSelectedCurrencies: true,
		showNoSynthsCard: true,
	});

	return (
		<StyledCenteredModal
			onDismiss={onDismiss}
			isOpen={true}
			title={t('modals.afterHours.title', { synth: SYNTHS_MAP.sTSLA })}
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
		width: 420px;
		margin: 0 auto;
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

export default BalancerTradeModal;
