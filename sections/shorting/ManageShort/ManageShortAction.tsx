import { FC, useState, useMemo, useEffect } from 'react';
// import styled from 'styled-components';
import { ethers } from 'ethers';
import { useRecoilValue } from 'recoil';
import { useTranslation } from 'react-i18next';

import synthetix from 'lib/synthetix';
import { normalizeGasLimit } from 'utils/network';
import ConnectWalletCard from 'sections/exchange/FooterCard/ConnectWalletCard';
import TxConfirmationModal from 'sections/shared/modals/TxConfirmationModal';
import { isWalletConnectedState } from 'store/wallet';
import TradeSummaryCard, {
	SubmissionDisabledReason,
} from 'sections/exchange/FooterCard/TradeSummaryCard';
import { ShortRecord } from 'queries/short/types';
import Notify from 'containers/Notify';
import useShortHistoryQuery from 'queries/short/useShortHistoryQuery';

import { ShortingTab } from './ManageShort';

interface ManageShortActionProps {
	short: ShortRecord;
	tab: ShortingTab;
	isActive: boolean;
}

const ManageShortAction: FC<ManageShortActionProps> = ({ short, tab, isActive }) => {
	const { t } = useTranslation();
	const isWalletConnected = useRecoilValue(isWalletConnectedState);
	const [txConfirmationModalOpen, setTxConfirmationModalOpen] = useState<boolean>(false);
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
	const [gasLimit, setGasLimit] = useState<number | null>(null);
	const [txError, setTxError] = useState<string | null>(null);
	const { monitorHash } = Notify.useContainer();
	const shortHistoryQuery = useShortHistoryQuery();

	const getShortParams = () => {
		return [
			// ethers.utils.parseUnits(quoteCurrencyAmount, DEFAULT_TOKEN_DECIMALS),
			// ethers.utils.parseUnits(baseCurrencyAmount, DEFAULT_TOKEN_DECIMALS),
			// ethers.utils.formatBytes32String(baseCurrencyKey!),
		];
	};

	const submissionDisabledReason: SubmissionDisabledReason | null = useMemo(() => {
		const insufficientBalance =
			currencyBalance != null ? quoteCurrencyAmountBN.gt(quoteCurrencyBalance) : false;

		if (insufficientBalance) {
			return 'insufficient-balance';
		}
		if (isSubmitting) {
			return 'submitting-order';
		}
		if (!isWalletConnected || currencyAmountBN.isNaN() || currencyAmountBN.lte(0)) {
			return 'enter-amount';
		}
		return null;
	}, [currencyBalance, isSubmitting, currencyAmountBN, isWalletConnected]);

	const getGasLimitEstimate = useEffect(() => {
		const getGasEstimate = async () => {
			if (gasLimit == null && submissionDisabledReason == null) {
				try {
					const gasEstimate = await synthetix.js!.contracts.CollateralShort.estimateGas.open(
						...getShortParams()
					);

					const gasLimitEstimate = normalizeGasLimit(Number(gasEstimate));
					setGasLimit(gasLimitEstimate);
				} catch (e) {
					console.log('getGasEstimate error:', e);
				}
			}
		};
		getGasEstimate();
		// eslint-disable-next-line
	}, [submissionDisabledReason, gasLimit]);

	const handleSubmit = async () => {
		if (synthetix.js != null && gasPrice != null) {
			setTxError(null);
			setTxConfirmationModalOpen(true);

			try {
				setIsSubmitting(true);

				let tx: ethers.ContractTransaction | null = null;

				const gasPriceWei = gasPriceInWei(gasPrice);

				const gasLimitEstimate = await getGasLimitEstimateForShort();

				setGasLimit(gasLimitEstimate);

				tx = (await synthetix.js.contracts.CollateralShort.open(...getShortParams(), {
					gasPrice: gasPriceWei,
					gasLimit: gasLimitEstimate,
				})) as ethers.ContractTransaction;

				if (tx != null && notify != null) {
					monitorHash({
						txHash: tx.hash,
						onTxConfirmed: () => {
							shortHistoryQuery.refetch();
						},
					});
				}
				setTxConfirmationModalOpen(false);
			} catch (e) {
				console.log(e);
				setTxError(e.message);
			} finally {
				setIsSubmitting(false);
			}
		}
	};

	return (
		<>
			{!isWalletConnected ? (
				<ConnectWalletCard attached={true} />
			) : (
				<TradeSummaryCard
					attached={true}
					submissionDisabledReason={submissionDisabledReason}
					onSubmit={handleSubmit}
					totalTradePrice={totalTradePrice.toString()}
					baseCurrencyAmount={baseCurrencyAmount}
					basePriceRate={basePriceRate}
					baseCurrency={baseCurrency}
					gasPrices={ethGasPriceQuery.data}
					feeReclaimPeriodInSeconds={0}
					quoteCurrencyKey={quoteCurrencyKey}
					feeRate={collateralShortFeeRate}
					transactionFee={transactionFee}
					feeCost={feeCost}
					showFee={true}
					isApproved={isApproved}
				/>
			)}
			{txConfirmationModalOpen && (
				<TxConfirmationModal
					onDismiss={() => setTxConfirmationModalOpen(false)}
					txError={txError}
					attemptRetry={handleSubmit}
					baseCurrencyAmount={baseCurrencyAmount}
					quoteCurrencyAmount={quoteCurrencyAmount}
					feeAmountInBaseCurrency={null}
					baseCurrencyKey={baseCurrencyKey!}
					quoteCurrencyKey={quoteCurrencyKey!}
					totalTradePrice={totalTradePrice.toString()}
					txProvider="synthetix"
					quoteCurrencyLabel={t('shorting.common.posting')}
					baseCurrencyLabel={t('shorting.common.shorting')}
					icon={<Svg src={ArrowRightIcon} />}
				/>
			)}
		</>
	);
};

export default ManageShortAction;
