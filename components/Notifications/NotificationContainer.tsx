import { createPortal } from 'react-dom';
import styled from 'styled-components';
import { ToastContainer, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { NotificationContainerType } from './constants';

const NotificationContainer = () => {
	return typeof document !== 'undefined'
		? createPortal(
				<>
					<StyledToastContainer
						enableMultiContainer
						transition={Slide}
						containerId={NotificationContainerType.HEADER}
						className={NotificationContainerType.HEADER}
						autoClose={false}
						closeOnClick={false}
						position={'top-center'}
					/>
					<StyledToastContainer
						enableMultiContainer
						transition={Slide}
						containerId={NotificationContainerType.TRANSACTION}
						className={NotificationContainerType.TRANSACTION}
						autoClose={false}
						closeOnClick={false}
						position={'bottom-right'}
					/>
				</>,
				document.body
		  )
		: null;
};

const StyledToastContainer = styled(ToastContainer)`
	&.Toastify__toast-container.header {
		top: 0 !important;
		width: 500px;
		padding: 0;
		.Toastify__toast {
			color: ${(props) => props.theme.colors.white};
			border-radius: 0 0 6px 6px;
			height: 45px;
			min-height: 45px;
			padding: 0;
		}
		.Toastify__toast-body {
			padding: 0;
			width: 100%;
			height: 100%;
			font-family: ${(props) => props.theme.fonts.regular};
			font-size: 14px;
			line-height: 14px;
		}
		.Toastify__close-button {
			opacity: 1;
			& > svg {
				position: absolute;
				fill: ${(props) => props.theme.colors.navy};
				top: 50%;
				transform: translateY(-50%);
				right: 16px;
			}
		}
	}
	&.Toastify__toast-container.transaction {
		border-radius: 4px;
		.Toastify__toast {
			background-color: ${(props) => props.theme.colors.navy};
			color: ${(props) => props.theme.colors.white};
		}
		.Toastify__toast-body {
			font-family: ${(props) => props.theme.fonts.regular};
			font-size: 14px;
			line-height: 14px;
		}
		.Toastify__progress-bar {
			background: ${(props) => props.theme.colors.gold};
			box-shadow: 0px 0px 15px rgb(228 179 120 / 60%);
		}
		.Toastify__close-button > svg {
			fill: ${(props) => props.theme.colors.white};
		}
	}
`;

export default NotificationContainer;
