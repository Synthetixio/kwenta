import React from 'react';
import styled, { css } from 'styled-components';
import { toast } from 'react-toastify';
import { Img } from 'react-optimized-image';
import i18n from 'i18n';
import { TransactionStatusData } from '@synthetixio/transaction-notifier';

import { FlexDivCentered, FlexDivCol, FlexDivRowCentered } from 'styles/common';
import { AUTOCLOSE_DELAY, NotificationContainerType } from './constants';

import Spinner from 'assets/svg/app/spinner.svg';
import Success from 'assets/svg/app/success.svg';
import Failure from 'assets/svg/app/failure.svg';

type NotificationProps = {
	closeToast?: Function;
	failureReason?: string;
};

const NotificationPending = () => {
	return (
		<NotificationContainer>
			<IconContainer>
				<StyledImg width={25} src={Spinner} />
			</IconContainer>
			<TransactionInfo>{i18n.t('common.transaction.transaction-sent')}</TransactionInfo>
		</NotificationContainer>
	);
};

const NotificationSuccess = () => {
	return (
		<NotificationContainer>
			<IconContainer>
				<StyledImg width={35} src={Success} />
			</IconContainer>
			<TransactionInfo>{i18n.t('common.transaction.transaction-confirmed')}</TransactionInfo>
		</NotificationContainer>
	);
};

const NotificationError = ({ failureReason }: NotificationProps) => {
	return (
		<NotificationContainer>
			<IconContainer>
				<StyledImg width={35} src={Failure} />
			</IconContainer>
			<TransactionInfo>
				<TransactionInfoBody>{i18n.t('common.transaction.transaction-failed')}</TransactionInfoBody>
				<TransactionInfoBody isFailureMessage={true}>{failureReason}</TransactionInfoBody>
			</TransactionInfo>
		</NotificationContainer>
	);
};

const TransactionNotificationPending = ({ link, transactionHash }: TransactionStatusData) => {
	const toastProps = {
		onClick: () => window.open(link, '_blank'),
		toastId: transactionHash,
		containerId: NotificationContainerType.TRANSACTION,
	};
	toast(NotificationPending, toastProps);
};

const TransactionNotificationSuccess = ({ link, transactionHash }: TransactionStatusData) => {
	const toastProps = {
		onClick: () => window.open(link, '_blank'),
		autoClose: AUTOCLOSE_DELAY,
		render: NotificationSuccess,
		containerId: NotificationContainerType.TRANSACTION,
	};
	toast.update(transactionHash, toastProps);
};

const TransactionNotificationError = ({
	link,
	transactionHash,
	failureReason,
}: TransactionStatusData) => {
	const toastProps = {
		onClick: () => window.open(link, '_blank'),
		containerId: NotificationContainerType.TRANSACTION,
		render: <NotificationError failureReason={failureReason} />,
	};
	toast.update(transactionHash, toastProps);
};

const NotificationContainer = styled(FlexDivCentered)``;
const IconContainer = styled(FlexDivRowCentered)`
	width: 35px;
	margin-right: 12px;
`;

const TransactionInfo = styled(FlexDivCol)``;
const TransactionInfoBody = styled.div<{ isFailureMessage?: boolean }>`
	${(props) =>
		props.isFailureMessage &&
		css`
			color: ${(props) => props.theme.colors.elderberry};
		`}
`;

const StyledImg = styled(Img)``;

export default {
	Pending: TransactionNotificationPending,
	Success: TransactionNotificationSuccess,
	Error: TransactionNotificationError,
};
