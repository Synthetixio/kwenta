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
		defaultQuoteCurrencyKey: SYNTHS_MAP.sTSLA,
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
			<StyledPageContent>
				{quoteCurrencyCard}
				<VerticalSpacer>
					<SwapCurrenciesButton onClick={handleCurrencySwap} data-testid="swap-btn">
						<Svg src={ArrowsIcon} />
					</SwapCurrenciesButton>
				</VerticalSpacer>
				{baseCurrencyCard}
				{footerCard}
			</StyledPageContent>
		</StyledCenteredModal>
	);
};

const StyledCenteredModal = styled(CenteredModal)`
	padding: 15px 20px;
`;

const StyledPageContent = styled.div`
	.currency-card {
		width: 312px;
		${media.lessThan('md')`
		width: 100%;
	`}
	}
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

export default BalancerTradeModal;
