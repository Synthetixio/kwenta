import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { Svg } from 'react-optimized-image';
import { CurrencyKey } from 'constants/currency';

import BalancerIcon from 'assets/svg/app/market-closure/balancer.svg';

import { CenteredModal } from '../common';

type BalancerApproveModalProps = {
	onDismiss: () => void;
	synth: CurrencyKey;
	approveError: string | null;
};

export const BalancerApproveModal: FC<BalancerApproveModalProps> = ({
	onDismiss,
	synth,
	approveError,
}) => {
	const { t } = useTranslation();
	return (
		<StyledCenteredModal
			onDismiss={onDismiss}
			isOpen={true}
			title={t('modals.afterHours.approve', { synth })}
		>
			<IconWrap>
				<Svg src={BalancerIcon} />
			</IconWrap>
			<SubText>{'modals.afterHours.balancer-pool'}</SubText>
			<ConfirmText>{'modals.afterHours.confirm-text'}</ConfirmText>
			{approveError != null ? <ErrorText>{approveError}</ErrorText> : null}
		</StyledCenteredModal>
	);
};

const StyledCenteredModal = styled(CenteredModal)`
	padding: 10px;
`;

const IconWrap = styled.div`
	padding: 20px 0 5px 0;
`;

const ErrorText = styled.div`
	color: ${(props) => props.theme.colors.red};
`;

const SubText = styled.div`
	color: ${(props) => props.theme.colors.white};
`;

const ConfirmText = styled.div`
	color: ${(props) => props.theme.colors.gray};
`;

export default BalancerApproveModal;
