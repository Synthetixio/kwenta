import { FC } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';

import { CardTitle } from 'sections/dashboard/common';

import PriceAdjustingTrade from './PriceAdjustingTrade';

const PriceAdjustingTrades: FC = () => {
	const { t } = useTranslation();
	const trades: number[] = [1];

	return !trades.length ? null : (
		<Container>
			<Title>{t('dashboard.price-adjusting-trades.title')}</Title>
			<Card>
				<PriceAdjustingTrade />
			</Card>
		</Container>
	);
};

const Container = styled.div`
	margin-bottom: 34px;
`;

const Title = styled(CardTitle)`
	margin-bottom: 12px;
	padding-bottom: 5px;
`;

const Card = styled.div`
	border-radius: 4px;
	background-color: ${(props) => props.theme.colors.elderberry};
	display: grid;
`;

export default PriceAdjustingTrades;
