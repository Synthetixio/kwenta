import { FC, useMemo } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';

import { CardTitle } from 'sections/dashboard/common';
import useFeeReclaimPeriods from 'hooks/synths/useFeeReclaimPeriods';
import FeeReclaimingSynth from './FeeReclaimingSynth';

const FeeReclaimingSynths: FC = () => {
	const { t } = useTranslation();

	const feeAndWaitingPeriods = useFeeReclaimPeriods();
	const show = useMemo(
		() => !!feeAndWaitingPeriods.find((fw) => !fw.fee.isZero() || fw.waitingPeriod !== 0),
		[feeAndWaitingPeriods]
	);

	return !show ? null : (
		<Container>
			<Title>{t('dashboard.fee-reclaiming-synths.title')}</Title>
			<Card>
				{feeAndWaitingPeriods.map(({ currencyKey, waitingPeriod, fee, noOfTrades }) => (
					<FeeReclaimingSynth
						key={currencyKey}
						{...{ currencyKey, waitingPeriod, fee, noOfTrades }}
					/>
				))}
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

export default FeeReclaimingSynths;
