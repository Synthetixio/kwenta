import { FC } from 'react';
import styled, { css } from 'styled-components';
import { toast } from 'react-toastify';
import { Svg } from 'react-optimized-image';

import { FlexDivCentered, FlexDivCol } from 'styles/common';
import { AUTOCLOSE_DELAY, NotificationContainerType } from './constants';
import Button from 'components/Button';

import InfoIcon from 'assets/svg/app/notif-info.svg';
import SuccessIcon from 'assets/svg/app/notif-success.svg';
import WarningIcon from 'assets/svg/app/notif-warning.svg';

const defaultNotificationProps = {
	containerId: NotificationContainerType.HEADER,
};

enum NotificationType {
	SUCCESS = 'success',
	INFO = 'info',
	WARNING = 'warning',
}

type NotificationProps = {
	title: string;
	message: string;
	actionLabel: string;
	callToAction: () => void;
};

type NotificationBodyProps = NotificationProps & {
	type: NotificationType;
};

const getIconFromNotificationType = (type: NotificationType) => {
	switch (type) {
		case NotificationType.SUCCESS:
			return <Svg src={SuccessIcon} />;
		case NotificationType.WARNING:
			return <Svg src={WarningIcon} />;
		case NotificationType.INFO:
		default:
			return <Svg src={InfoIcon} />;
	}
};

const NotificationBody: FC<NotificationBodyProps> = ({
	type,
	callToAction,
	title,
	message,
	actionLabel,
}) => {
	return (
		<NotificationContainer type={type}>
			<FlexDivCentered>
				<IconContainer>{getIconFromNotificationType(type)}</IconContainer>
				<FlexDivCol>
					<NotificationText>{title}</NotificationText>
					<NotificationTextSmall>{message}</NotificationTextSmall>
				</FlexDivCol>
			</FlexDivCentered>
			<FlexDivCentered>
				<CTAButton onClick={callToAction}>{actionLabel}</CTAButton>
			</FlexDivCentered>
		</NotificationContainer>
	);
};

const NotificationSuccess = (props: NotificationProps) => {
	const toastProps = {
		...defaultNotificationProps,
	};
	toast(<NotificationBody type={NotificationType.SUCCESS} {...props} />, toastProps);
};

const NotificationInfo = (props: NotificationProps) => {
	const toastProps = {
		...defaultNotificationProps,
	};
	toast(<NotificationBody type={NotificationType.INFO} {...props} />, toastProps);
};

const NotificationWarning = (props: NotificationProps) => {
	const toastProps = {
		...defaultNotificationProps,
	};
	toast(<NotificationBody type={NotificationType.WARNING} {...props} />, toastProps);
};

const InfoStyle = css`
	background-color: ${(props) => props.theme.colors.silver};
`;
const SuccessStyle = css`
	background-color: ${(props) => props.theme.colors.green};
`;
const WarningStyle = css`
	background-color: ${(props) => props.theme.colors.red};
`;

const NotificationContainer = styled(FlexDivCentered)<{ type: NotificationType }>`
	width: 100%;
	height: 100%;
	padding: 0 36px 0 16px;
	justify-content: space-between;
	${(props) => props.type === NotificationType.SUCCESS && SuccessStyle}
	${(props) => props.type === NotificationType.INFO && InfoStyle}
	${(props) => props.type === NotificationType.WARNING && WarningStyle}
`;

const IconContainer = styled(FlexDivCentered)`
	width: 35px;
	margin-right: 12px;
`;

const CTAButton = styled(Button).attrs({ isRounded: true, variant: 'primary' })`
	background: ${(props) => props.theme.colors.navy};
	font-family: ${(props) => props.theme.fonts.regular};
	font-size: 12px;
	height: 30px;
	&:hover {
		&:not(:disabled) {
			background: ${(props) => props.theme.colors.navy};
		}
	}
`;

const NotificationText = styled.h6`
	margin: 0;
	font-family: ${(props) => props.theme.fonts.bold};
	font-size: 14px;
`;

const NotificationTextSmall = styled(NotificationText)`
	font-size: 12px;
`;

export default {
	Success: NotificationSuccess,
	Info: NotificationInfo,
	Warning: NotificationWarning,
};
