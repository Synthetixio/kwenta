import { createContainer } from 'unstated-next';
import { TransactionStatusData } from '@synthetixio/transaction-notifier';

import Connector from 'containers/Connector';
import Etherscan from 'containers/BlockExplorer';

import TransactionNotification from 'components/Notifications/TransactionNotification';

const useTransactionNotifier = () => {
	const { transactionNotifier } = Connector.useContainer();
	const { blockExplorerInstance } = Etherscan.useContainer();

	const monitorTransaction = ({
		txHash,
		onTxConfirmed,
		onTxFailed,
	}: {
		txHash: string;
		onTxSent?: () => void;
		onTxConfirmed?: () => void;
		onTxFailed?: (failureMessage: TransactionStatusData) => void;
	}) => {
		const link = blockExplorerInstance != null ? blockExplorerInstance.txLink(txHash) : undefined;
		if (transactionNotifier) {
			const emitter = transactionNotifier.hash(txHash);
			emitter.on('txSent', () => {
				TransactionNotification.Pending({ link, transactionHash: txHash });
			});
			emitter.on('txConfirmed', ({ transactionHash }: TransactionStatusData) => {
				TransactionNotification.Success({ link, transactionHash });
				if (onTxConfirmed != null) {
					onTxConfirmed();
				}
			});
			emitter.on('txFailed', ({ transactionHash, failureReason }: TransactionStatusData) => {
				TransactionNotification.Error({ link, transactionHash, failureReason });
				if (onTxFailed != null) {
					onTxFailed({ transactionHash, failureReason });
				}
			});
		}
	};
	return { monitorTransaction };
};

const TransactionNotifier = createContainer(useTransactionNotifier);

export default TransactionNotifier;
