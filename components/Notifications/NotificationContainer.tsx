import { createPortal } from 'react-dom';
import styled from 'styled-components';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { NotificationContainerType } from './constants';

const NotificationContainer = () => {
	return typeof document !== 'undefined'
		? createPortal(
				<TransactionNotificationContainer
					enableMultiContainer
					containerId={NotificationContainerType.TRANSACTION}
					autoClose={false}
					closeOnClick={false}
					position={'bottom-right'}
				/>,
				document.body
		  )
		: null;
};

const TransactionNotificationContainer = styled(ToastContainer)`
	.Toastify__toast-container {
		background-color: ${(props) => props.theme.colors.navy};
		border: 1px solid ${(props) => props.theme.colors.green};
		border-radius: 4px;
	}
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
		fill: white;
	}
`;

export default NotificationContainer;
