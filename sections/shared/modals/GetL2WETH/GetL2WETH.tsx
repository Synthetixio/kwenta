import { FC } from 'react';
import styled from 'styled-components';
import { useTranslation, Trans } from 'react-i18next';

import Button from 'components/Button';
import { CRYPTO_CURRENCY_MAP, SYNTHS_MAP } from 'constants/currency';
import { EXTERNAL_LINKS } from 'constants/links';
import { ExternalLink, NoTextTransform } from 'styles/common';
import { useL2Gas } from 'hooks/useL2Gas';

import { MenuModal } from '../common';

const GetL2WETH: FC = () => {
	const { t } = useTranslation();
	const { closeGetWETHPrompt, showGetWETHPrompt } = useL2Gas();

	return (
		<Container
			onDismiss={closeGetWETHPrompt}
			isOpen={showGetWETHPrompt}
			title={t('modals.get-l2-weth.title')}
		>
			<Message>
				<MessageBody>{t('modals.get-l2-weth.message')}</MessageBody>
				<ExternalLink
					href={EXTERNAL_LINKS.Trading.OneInchLink(CRYPTO_CURRENCY_MAP.ETH, SYNTHS_MAP.sETH)}
				>
					<Button variant="primary" size="lg" isRounded={true}>
						<Trans
							t={t}
							i18nKey="modals.get-l2-weth.get-eth"
							values={{ currencyKey: SYNTHS_MAP.ETH }}
							components={[<NoTextTransform />]}
						/>
					</Button>
				</ExternalLink>
			</Message>
		</Container>
	);
};

const Container = styled(MenuModal)`
	[data-reach-dialog-content] {
		margin-left: auto;
		margin-right: auto;
	}
	.card-body {
		padding: 24px;
	}
`;

const Message = styled.div`
	font-size: 14px;
	color: ${(props) => props.theme.colors.white};
	font-family: ${(props) => props.theme.fonts.bold};
	text-align: center;
`;

const MessageBody = styled.div`
	padding-bottom: 20px;
`;

export default GetL2WETH;
