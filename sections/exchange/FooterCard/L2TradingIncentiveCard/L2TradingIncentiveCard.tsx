import { FC, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import Link from 'next/link';
import { Svg } from 'react-optimized-image';

import CloseSvg from 'assets/svg/app/cross.svg';
import { FlexDiv } from 'styles/common';

import { MessageContainer as BaseMassageContainer, Message as BaseMassage } from '../common';

type L2TradingIncentiveCardProps = {
	attached?: boolean;
};

const L2TradingIncentiveCard: FC<L2TradingIncentiveCardProps> = ({ attached }) => {
	const { t } = useTranslation();
	const [show, setShow] = useState<boolean>(true);
	const close = () => setShow(false);

	return !show ? null : (
		<MessageContainer {...{ attached }} className="footer-card">
			<FlexDiv>
				<Message>{t('l2-trading-incentives.message')}</Message>
				<Link href={'http://synthetix.io'}>{t('common.learn-more')}</Link>
			</FlexDiv>

			<CloseButtonContainer onClick={close}>
				<Svg src={CloseSvg} />
			</CloseButtonContainer>
		</MessageContainer>
	);
};

export default L2TradingIncentiveCard;

const MessageContainer = styled(BaseMassageContainer)`
	a {
		font-family: ${(props) => props.theme.fonts.bold};
		text-transform: uppercase;
		color: ${(props) => props.theme.colors.goldColors.color1};
		&:hover {
			opacity: 0.8;
		}
	}
`;

const Message = styled(BaseMassage)`
	text-align: left;
	margin-right: 10px;
	flex-grow: 0;
`;

const CloseButtonContainer = styled.div`
	cursor: pointer;
`;
