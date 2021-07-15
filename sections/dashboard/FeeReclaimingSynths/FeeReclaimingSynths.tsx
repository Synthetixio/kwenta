import { FC, ReactNode } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';

import { CardTitle } from 'sections/dashboard/common';
// import useFeeReclaimingSynths from 'hooks/trades/useFeeReclaimingSynths';
import { SYNTHS } from 'constants/currency';

import FeeReclaimingSynth from './FeeReclaimingSynth';

const FeeReclaimingSynths: FC = () => {
	const { t } = useTranslation();

	const feeReclaimingSynths: ReactNode[] = SYNTHS.map((currencyKey) => (
		<FeeReclaimingSynth key={currencyKey} {...{ currencyKey }} />
	));

	const show = feeReclaimingSynths.find((synth) => !!synth);

	return !show ? null : (
		<Container>
			<Title>{t('dashboard.fee-reclaiming-synths.title')}</Title>
			<Card>{feeReclaimingSynths}</Card>
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

export default FeeReclaimingSynths;
