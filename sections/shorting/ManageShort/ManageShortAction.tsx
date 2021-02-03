import { FC, useState, useMemo, useEffect } from 'react';
import { ethers } from 'ethers';
import { useRecoilValue } from 'recoil';
import { useTranslation } from 'react-i18next';
import { Svg } from 'react-optimized-image';

import TxApproveModal from 'sections/shared/modals/TxApproveModal';
import ArrowRightIcon from 'assets/svg/app/circle-arrow-right.svg';
import { DEFAULT_TOKEN_DECIMALS, SYNTHS_MAP } from 'constants/currency';
import { getExchangeRatesForCurrencies, synthToContractName } from 'utils/currencies';
import synthetix from 'lib/synthetix';
import { normalizeGasLimit, gasPriceInWei, getTransactionPrice } from 'utils/network';
import ConnectWalletCard from 'sections/exchange/FooterCard/ConnectWalletCard';
import TxConfirmationModal from 'sections/shared/modals/TxConfirmationModal';
import useEthGasPriceQuery from 'queries/network/useEthGasPriceQuery';

import useCollateralShortIssuanceFee from 'queries/collateral/useCollateralShortIssuanceFee';
import useSynthsBalancesQuery from 'queries/walletBalances/useSynthsBalancesQuery';
import TradeSummaryCard, {
	SubmissionDisabledReason,
} from 'sections/exchange/FooterCard/TradeSummaryCard';
import { Short } from 'queries/short/types';
import Connector from 'containers/Connector';
import Notify from 'containers/Notify';
import useShortHistoryQuery from 'queries/short/useShortHistoryQuery';
import CurrencyCard from 'sections/exchange/TradeCard/CurrencyCard';
import useSelectedPriceCurrency from 'hooks/useSelectedPriceCurrency';
import useExchangeRatesQuery from 'queries/rates/useExchangeRatesQuery';
import { toBigNumber, zeroBN } from 'utils/formatters/number';
import {
	customGasPriceState,
	gasSpeedState,
	isWalletConnectedState,
	walletAddressState,
} from 'store/wallet';
import { NoTextTransform } from 'styles/common';

import { ShortingTab } from './ManageShort';

interface ManageShortActionProps {
	short: Short;
	tab: ShortingTab;
	isActive: boolean;
}

const ManageShortAction: FC<ManageShortActionProps> = ({ short, tab, isActive }) => {
	const { t } = useTranslation();
	const [isApproving, setIsApproving] = useState<boolean>(false);
	const [isApproved, setIsApproved] = useState<boolean>(false);
	const isWalletConnected = useRecoilValue(isWalletConnectedState);
	const [txConfirmationModalOpen, setTxConfirmationModalOpen] = useState<boolean>(false);
	const [txApproveModalOpen, setTxApproveModalOpen] = useState<boolean>(false);
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
	const [inputAmount, setInputAmount] = useState<string>('');
	const [gasLimit, setGasLimit] = useState<number | null>(null);
	const [txError, setTxError] = useState<string | null>(null);
	const { notify } = Connector.useContainer();
	const { monitorHash } = Notify.useContainer();
	const shortHistoryQuery = useShortHistoryQuery();
	const { selectPriceCurrencyRate, selectedPriceCurrency } = useSelectedPriceCurrency();
	const exchangeRatesQuery = useExchangeRatesQuery();
	const ethGasPriceQuery = useEthGasPriceQuery();
	const customGasPrice = useRecoilValue(customGasPriceState);
	const gasSpeed = useRecoilValue(gasSpeedState);
	const walletAddress = useRecoilValue(walletAddressState);
	const synthsWalletBalancesQuery = useSynthsBalancesQuery();
	const collateralShortFeeRateQuery = useCollateralShortIssuanceFee();
	const collateralShortFeeRate = collateralShortFeeRateQuery.isSuccess
		? collateralShortFeeRateQuery.data ?? null
		: null;

	const needsApproval = tab === ShortingTab.AddCollateral;

	const isCollateralChange =
		tab === ShortingTab.AddCollateral || tab === ShortingTab.RemoveCollateral;

	const currencyKey = isCollateralChange ? short.collateralLocked : short.synthBorrowed;

	const balance = synthsWalletBalancesQuery.data?.balancesMap[currencyKey].balance ?? null;

	const inputAmountBN = useMemo(() => toBigNumber(inputAmount ?? 0), [inputAmount]);

	const getMethodAndParams = (
		isEstimate: boolean = false
	): { tx: ethers.ContractFunction; params: Array<ethers.BigNumber | string> } => {
		const idParam = ethers.utils.parseUnits(String(short.id), DEFAULT_TOKEN_DECIMALS);
		const amountParam = ethers.utils.parseUnits(inputAmountBN.toString(), DEFAULT_TOKEN_DECIMALS);
		let params;
		let tx;
		switch (tab) {
			case ShortingTab.AddCollateral:
				params = [walletAddress as string, idParam, amountParam];
				tx = isEstimate
					? synthetix.js!.contracts.CollateralShort.estimateGas.deposit
					: synthetix.js!.contracts.CollateralShort.deposit;
				break;
			case ShortingTab.RemoveCollateral:
				params = [idParam, amountParam];
				tx = isEstimate
					? synthetix.js!.contracts.CollateralShort.estimateGas.withdraw
					: synthetix.js!.contracts.CollateralShort.withdraw;
				break;
			case ShortingTab.DecreasePosition:
				params = [walletAddress as string, idParam, amountParam];
				tx = isEstimate
					? synthetix.js!.contracts.CollateralShort.estimateGas.repay
					: synthetix.js!.contracts.CollateralShort.repay;
				break;
			case ShortingTab.IncreasePosition:
				params = [idParam, amountParam];
				tx = isEstimate
					? synthetix.js!.contracts.CollateralShort.estimateGas.draw
					: synthetix.js!.contracts.CollateralShort.draw;
				break;
			default:
				throw new Error('unrecognized tab');
		}
		return { tx, params };
	};

	const gasPrice = useMemo(
		() =>
			customGasPrice !== ''
				? Number(customGasPrice)
				: ethGasPriceQuery.data != null
				? ethGasPriceQuery.data[gasSpeed]
				: null,
		[customGasPrice, ethGasPriceQuery.data, gasSpeed]
	);

	const exchangeRates = exchangeRatesQuery.isSuccess ? exchangeRatesQuery.data ?? null : null;

	const synthPriceRate = useMemo(
		() => getExchangeRatesForCurrencies(exchangeRates, currencyKey, selectedPriceCurrency.name),
		[exchangeRates, currencyKey, selectedPriceCurrency.name]
	);

	const ethPriceRate = useMemo(
		() => getExchangeRatesForCurrencies(exchangeRates, SYNTHS_MAP.sETH, selectedPriceCurrency.name),
		[exchangeRates, selectedPriceCurrency.name]
	);

	const totalTradePrice = useMemo(() => {
		if (inputAmountBN.isNaN()) {
			return zeroBN;
		}
		let tradePrice = inputAmountBN.multipliedBy(synthPriceRate);
		if (selectPriceCurrencyRate) {
			tradePrice = tradePrice.dividedBy(selectPriceCurrencyRate);
		}

		return tradePrice;
	}, [inputAmountBN, synthPriceRate, selectPriceCurrencyRate]);

	const submissionDisabledReason: SubmissionDisabledReason | null = useMemo(() => {
		if (!isWalletConnected || inputAmountBN.isNaN() || inputAmountBN.lte(0)) {
			return 'enter-amount';
		}
		if (inputAmountBN.gt(balance ?? 0)) {
			return 'insufficient-balance';
		}
		if (isSubmitting) {
			return 'submitting-order';
		}
		if (isApproving) {
			return 'approving';
		}
		return null;
	}, [isApproving, balance, isSubmitting, inputAmountBN, isWalletConnected]);

	const getGasLimitEstimate = async (): Promise<number | null> => {
		try {
			const { tx, params } = getMethodAndParams(true);
			const gasEstimate = await tx(params);
			return normalizeGasLimit(Number(gasEstimate));
		} catch (e) {
			console.log('getGasEstimate error:', e);
			return null;
		}
	};

	useEffect(() => {
		async function updateGasLimit() {
			if (!isActive) {
				setGasLimit(null);
			} else if (isActive && gasLimit == null && submissionDisabledReason == null) {
				const newGasLimit = await getGasLimitEstimate();
				setGasLimit(newGasLimit);
			}
		}
		updateGasLimit();
	}, [submissionDisabledReason, gasLimit, isActive, getGasLimitEstimate]);

	const handleSubmit = async () => {
		if (synthetix.js != null && gasPrice != null) {
			setTxError(null);
			setTxConfirmationModalOpen(true);

			try {
				setIsSubmitting(true);

				let transaction: ethers.ContractTransaction | null = null;

				const gasPriceWei = gasPriceInWei(gasPrice);
				getGasLimitEstimate();

				const gasLimitEstimate = await getGasLimitEstimate();

				setGasLimit(gasLimitEstimate);

				const { tx, params } = getMethodAndParams(true);

				transaction = (await tx(...params, {
					gasPrice: gasPriceWei,
					gasLimit: gasLimitEstimate,
				})) as ethers.ContractTransaction;

				if (transaction != null && notify != null) {
					monitorHash({
						txHash: transaction.hash,
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

	const approve = async () => {
		if (currencyKey != null && gasPrice != null) {
			setTxError(null);
			setTxApproveModalOpen(true);

			try {
				setIsApproving(true);

				const { contracts } = synthetix.js!;

				const collateralContract = contracts[synthToContractName(currencyKey)];

				const gasEstimate = await collateralContract.estimateGas.approve(
					contracts.CollateralShort.address,
					ethers.constants.MaxUint256
				);
				const gasPriceWei = gasPriceInWei(gasPrice);

				const tx = await collateralContract.approve(
					contracts.CollateralShort.address,
					ethers.constants.MaxUint256,
					{
						gasLimit: normalizeGasLimit(Number(gasEstimate)),
						gasPrice: gasPriceWei,
					}
				);
				if (tx != null) {
					monitorHash({
						txHash: tx.hash,
						onTxConfirmed: () => {
							setIsApproving(false);
							// TODO: check for allowance or can we assume its ok?
							setIsApproved(true);
						},
					});
				}
				setTxApproveModalOpen(false);
			} catch (e) {
				console.log(e);
				setIsApproving(false);
				setTxError(e.message);
			}
		}
	};

	const transactionFee = useMemo(() => getTransactionPrice(gasPrice, gasLimit, ethPriceRate), [
		gasPrice,
		gasLimit,
		ethPriceRate,
	]);

	const feeAmountInBaseCurrency = useMemo(() => {
		if (collateralShortFeeRate != null && inputAmountBN.gt(0)) {
			return inputAmountBN.multipliedBy(collateralShortFeeRate);
		}
		return null;
	}, [inputAmountBN, collateralShortFeeRate]);

	const feeCost = useMemo(() => {
		if (feeAmountInBaseCurrency != null) {
			return feeAmountInBaseCurrency.multipliedBy(synthPriceRate);
		}
		return null;
	}, [feeAmountInBaseCurrency, synthPriceRate]);

	const currency =
		currencyKey != null && synthetix.synthsMap != null ? synthetix.synthsMap[currencyKey] : null;

	return (
		<>
			{!isWalletConnected ? (
				<ConnectWalletCard attached={true} />
			) : (
				<>
					<CurrencyCard
						side="base"
						currencyKey={currencyKey}
						amount={inputAmount}
						onAmountChange={setInputAmount}
						walletBalance={balance}
						onBalanceClick={() => (balance != null ? setInputAmount(balance.toString()) : null)}
						priceRate={synthPriceRate}
						label={
							isCollateralChange
								? t('shorting.history.manageShort.sections.panel.collateral')
								: t('shorting.history.manageShort.sections.panel.shorting')
						}
					/>
					<TradeSummaryCard
						attached={true}
						submissionDisabledReason={submissionDisabledReason}
						onSubmit={needsApproval ? (isApproved ? handleSubmit : approve) : handleSubmit}
						totalTradePrice={totalTradePrice.toString()}
						baseCurrencyAmount={inputAmount}
						basePriceRate={synthPriceRate}
						baseCurrency={currency}
						gasPrices={ethGasPriceQuery.data}
						feeReclaimPeriodInSeconds={0}
						quoteCurrencyKey={null}
						feeRate={collateralShortFeeRate}
						transactionFee={tab === ShortingTab.AddCollateral ? transactionFee : 0}
						feeCost={feeCost}
						showFee={true}
						isApproved={isApproved}
					/>
				</>
			)}
			{txApproveModalOpen && (
				<TxApproveModal
					onDismiss={() => setTxApproveModalOpen(false)}
					txError={txError}
					attemptRetry={approve}
					currencyKey={currencyKey!}
					currencyLabel={<NoTextTransform>{currencyKey}</NoTextTransform>}
				/>
			)}
			{txConfirmationModalOpen && (
				<TxConfirmationModal
					onDismiss={() => setTxConfirmationModalOpen(false)}
					txError={txError}
					attemptRetry={handleSubmit}
					baseCurrencyAmount={inputAmountBN.toString()}
					quoteCurrencyAmount={'0'}
					feeAmountInBaseCurrency={null}
					baseCurrencyKey={currencyKey}
					quoteCurrencyKey={currencyKey}
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
