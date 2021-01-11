import { useState, useEffect, useMemo, useCallback } from 'react';
import { ethers } from 'ethers';
import { useRecoilValue } from 'recoil';
import get from 'lodash/get';

import BigNumber from 'bignumber.js';

import { CurrencyKey, SYNTHS_MAP } from 'constants/currency';

import Connector from 'containers/Connector';
import Etherscan from 'containers/Etherscan';

import useSynthsBalancesQuery from 'queries/walletBalances/useSynthsBalancesQuery';
import useEthGasPriceQuery from 'queries/network/useEthGasPriceQuery';
import useExchangeRatesQuery from 'queries/rates/useExchangeRatesQuery';

import CurrencyCard from 'sections/exchange/TradeCard/CurrencyCard';
import TradeSummaryCard, {
	SubmissionDisabledReason,
} from 'sections/exchange/FooterCard/TradeSummaryCard';
import NoSynthsCard from 'sections/exchange/FooterCard/NoSynthsCard';
import MarketClosureCard from 'sections/exchange/FooterCard/MarketClosureCard';
import ConnectWalletCard from 'sections/exchange/FooterCard/ConnectWalletCard';
import TxConfirmationModal from 'sections/shared/modals/TxConfirmationModal';

import {
	customGasPriceState,
	gasSpeedState,
	isWalletConnectedState,
	walletAddressState,
} from 'store/wallet';

import { getExchangeRatesForCurrencies, synthToContractName } from 'utils/currencies';

import synthetix from 'lib/synthetix';

import useMarketClosed from 'hooks/useMarketClosed';
import useSelectedPriceCurrency from 'hooks/useSelectedPriceCurrency';

import { getTransactionPrice, normalizeGasLimit, gasPriceInWei } from 'utils/network';

import { toBigNumber, zeroBN } from 'utils/formatters/number';

import useCollateralShortIssuanceFee from 'queries/collateral/useCollateralShortIssuanceFee';

const MIN_SHORT_RATIO = 2;

type ExchangeCardProps = {
	defaultBaseCurrencyKey?: CurrencyKey | null;
	defaultQuoteCurrencyKey?: CurrencyKey | null;
};

const useExchange = ({
	defaultBaseCurrencyKey = null,
	defaultQuoteCurrencyKey = null,
}: ExchangeCardProps) => {
	const { notify } = Connector.useContainer();
	const { etherscanInstance } = Etherscan.useContainer();

	const [currencyPair, setCurrencyPair] = useState<{
		base: CurrencyKey | null;
		quote: CurrencyKey | null;
	}>({
		base: defaultBaseCurrencyKey,
		quote: defaultQuoteCurrencyKey,
	});

	const [isApproving, setIsApproving] = useState<boolean>(false);
	const [isApproved, setIsApproved] = useState<boolean>(false);
	const [baseCurrencyAmount, setBaseCurrencyAmount] = useState<string>('');
	const [quoteCurrencyAmount, setQuoteCurrencyAmount] = useState<string>('');
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
	const isWalletConnected = useRecoilValue(isWalletConnectedState);
	const walletAddress = useRecoilValue(walletAddressState);
	const [txConfirmationModalOpen, setTxConfirmationModalOpen] = useState<boolean>(false);
	const [txError, setTxError] = useState<boolean>(false);
	const gasSpeed = useRecoilValue(gasSpeedState);
	const customGasPrice = useRecoilValue(customGasPriceState);
	const { selectPriceCurrencyRate, selectedPriceCurrency } = useSelectedPriceCurrency();

	const [gasLimit, setGasLimit] = useState<number | null>(null);

	const { base: baseCurrencyKey, quote: quoteCurrencyKey } = currencyPair;

	const synthsWalletBalancesQuery = useSynthsBalancesQuery();
	const ethGasPriceQuery = useEthGasPriceQuery();
	const exchangeRatesQuery = useExchangeRatesQuery();
	const collateralShortFeeRateQuery = useCollateralShortIssuanceFee();
	const collateralShortFeeRate = collateralShortFeeRateQuery.isSuccess
		? collateralShortFeeRateQuery.data ?? null
		: null;

	const baseCurrency =
		baseCurrencyKey != null && synthetix.synthsMap != null
			? synthetix.synthsMap[baseCurrencyKey]
			: null;
	const exchangeRates = exchangeRatesQuery.isSuccess ? exchangeRatesQuery.data ?? null : null;

	const rate = useMemo(
		() => getExchangeRatesForCurrencies(exchangeRates, quoteCurrencyKey, baseCurrencyKey),
		[exchangeRates, quoteCurrencyKey, baseCurrencyKey]
	);
	const inverseRate = useMemo(() => (rate > 0 ? 1 / rate : 0), [rate]);

	const baseCurrencyBalance =
		baseCurrencyKey != null && synthsWalletBalancesQuery.isSuccess
			? get(synthsWalletBalancesQuery.data, ['balancesMap', baseCurrencyKey, 'balance'], zeroBN)
			: null;

	let quoteCurrencyBalance: BigNumber | null = null;
	if (quoteCurrencyKey != null) {
		quoteCurrencyBalance = synthsWalletBalancesQuery.isSuccess
			? get(synthsWalletBalancesQuery.data, ['balancesMap', quoteCurrencyKey, 'balance'], zeroBN)
			: null;
	}

	const basePriceRate = useMemo(
		() => getExchangeRatesForCurrencies(exchangeRates, baseCurrencyKey, selectedPriceCurrency.name),
		[exchangeRates, baseCurrencyKey, selectedPriceCurrency.name]
	);
	const quotePriceRate = useMemo(
		() =>
			getExchangeRatesForCurrencies(exchangeRates, quoteCurrencyKey, selectedPriceCurrency.name),
		[exchangeRates, quoteCurrencyKey, selectedPriceCurrency.name]
	);
	const ethPriceRate = useMemo(
		() => getExchangeRatesForCurrencies(exchangeRates, SYNTHS_MAP.sETH, selectedPriceCurrency.name),
		[exchangeRates, selectedPriceCurrency.name]
	);

	const baseCurrencyAmountBN = useMemo(() => toBigNumber(baseCurrencyAmount), [baseCurrencyAmount]);
	const quoteCurrencyAmountBN = useMemo(() => toBigNumber(quoteCurrencyAmount), [
		quoteCurrencyAmount,
	]);

	// const baseCurrencyAmountEthersBN = useMemo(() => {
	// 	try {
	// 		return ethers.utils.parseUnits(baseCurrencyAmount.toString(), 18);
	// 	} catch {
	// 		return ethers.BigNumber.from('0');
	// 	}
	// }, [baseCurrencyAmount]);

	const totalTradePrice = useMemo(() => {
		let tradePrice = quoteCurrencyAmountBN.multipliedBy(quotePriceRate);
		if (selectPriceCurrencyRate) {
			tradePrice = tradePrice.dividedBy(selectPriceCurrencyRate);
		}

		return tradePrice;
	}, [quoteCurrencyAmountBN, quotePriceRate, selectPriceCurrencyRate]);

	const selectedBothSides = useMemo(() => baseCurrencyKey != null && quoteCurrencyKey != null, [
		baseCurrencyKey,
		quoteCurrencyKey,
	]);

	const baseCurrencyMarketClosed = useMarketClosed(baseCurrencyKey);
	const quoteCurrencyMarketClosed = useMarketClosed(quoteCurrencyKey);

	const submissionDisabledReason: SubmissionDisabledReason | null = useMemo(() => {
		const insufficientBalance =
			quoteCurrencyBalance != null ? quoteCurrencyAmountBN.gt(quoteCurrencyBalance) : false;

		if (!selectedBothSides) {
			return 'select-synth';
		}
		if (insufficientBalance) {
			return 'insufficient-balance';
		}
		if (isSubmitting) {
			return 'submitting-order';
		}
		if (isApproving) {
			return 'approving';
		}
		if (
			!isWalletConnected ||
			baseCurrencyAmountBN.isNaN() ||
			quoteCurrencyAmountBN.isNaN() ||
			baseCurrencyAmountBN.lte(0) ||
			quoteCurrencyAmountBN.lte(0)
		) {
			return 'enter-amount';
		}
		return null;
	}, [
		isApproving,
		quoteCurrencyBalance,
		selectedBothSides,
		isSubmitting,
		baseCurrencyAmountBN,
		quoteCurrencyAmountBN,
		isWalletConnected,
	]);

	const noSynths =
		synthsWalletBalancesQuery.isSuccess && synthsWalletBalancesQuery.data
			? synthsWalletBalancesQuery.data.balances.length === 0
			: false;

	const gasPrice = useMemo(
		() =>
			customGasPrice !== ''
				? Number(customGasPrice)
				: ethGasPriceQuery.data != null
				? ethGasPriceQuery.data[gasSpeed]
				: null,
		[customGasPrice, ethGasPriceQuery.data, gasSpeed]
	);

	const transactionFee = useMemo(() => getTransactionPrice(gasPrice, gasLimit, ethPriceRate), [
		gasPrice,
		gasLimit,
		ethPriceRate,
	]);

	const feeAmountInBaseCurrency = useMemo(() => {
		if (collateralShortFeeRate != null && baseCurrencyAmount) {
			return toBigNumber(baseCurrencyAmount).multipliedBy(collateralShortFeeRate);
		}
		return null;
	}, [baseCurrencyAmount, collateralShortFeeRate]);

	const feeCost = useMemo(() => {
		if (feeAmountInBaseCurrency != null) {
			return feeAmountInBaseCurrency.multipliedBy(basePriceRate);
		}
		return null;
	}, [feeAmountInBaseCurrency, basePriceRate]);

	const checkAllowance = useCallback(async () => {
		if (isWalletConnected && quoteCurrencyKey != null && quoteCurrencyAmount) {
			try {
				const allowance = await synthetix.js!.contracts[
					synthToContractName(quoteCurrencyKey)
				].allowance(walletAddress, synthetix.js!.contracts.CollateralShort.address);

				setIsApproved(toBigNumber(allowance).gte(quoteCurrencyAmount));
			} catch (e) {
				console.log(e);
			}
		}
	}, [quoteCurrencyAmount, isWalletConnected, quoteCurrencyKey, walletAddress]);

	useEffect(() => {
		checkAllowance();
	}, [checkAllowance]);

	// An attempt to show correct gas fees while making as few calls as possible. (as soon as the submission is "valid", compute it once)
	useEffect(() => {
		const getGasEstimate = async () => {
			if (gasLimit == null && submissionDisabledReason == null) {
				const gasLimitEstimate = await getGasLimitEstimateForShort();
				setGasLimit(gasLimitEstimate);
			}
		};
		getGasEstimate();
		// eslint-disable-next-line
	}, [submissionDisabledReason, gasLimit]);

	// reset estimated gas limit when currencies are changed.
	useEffect(() => {
		setGasLimit(null);
	}, [baseCurrencyKey, quoteCurrencyKey]);

	const getShortParams = () => {
		const baseKeyBytes32 = ethers.utils.formatBytes32String(baseCurrencyKey!);
		const quoteCurrencyAmountBN = ethers.utils.parseEther(quoteCurrencyAmount);
		const baseCurrencyAmountBN = ethers.utils.parseEther(baseCurrencyAmount);

		return [quoteCurrencyAmountBN, baseCurrencyAmountBN, baseKeyBytes32];
	};

	const getGasLimitEstimateForShort = async () => {
		try {
			const gasEstimate = await synthetix.js!.contracts.CollateralShort.estimateGas.open(
				...getShortParams()
			);

			return normalizeGasLimit(Number(gasEstimate));
		} catch (e) {
			console.log(e);
		}
		return null;
	};

	const handleSubmit = async () => {
		if (synthetix.js != null && gasPrice != null) {
			setTxError(false);
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

				if (tx != null) {
					if (notify) {
						const { emitter } = notify.hash(tx.hash);
						const link = etherscanInstance != null ? etherscanInstance.txLink(tx.hash) : undefined;

						emitter.on('txConfirmed', () => {
							synthsWalletBalancesQuery.refetch();
							return {
								autoDismiss: 0,
								link,
							};
						});

						emitter.on('all', () => {
							return {
								link,
							};
						});
					}
				}
				setTxConfirmationModalOpen(false);
			} catch (e) {
				console.log(e);
				setTxError(true);
			} finally {
				setIsSubmitting(false);
			}
		}
	};

	const quoteCurrencyCard = (
		<CurrencyCard
			side="quote"
			currencyKey={quoteCurrencyKey}
			amount={quoteCurrencyAmount}
			onAmountChange={(value) => {
				if (value === '') {
					setQuoteCurrencyAmount('');
					setBaseCurrencyAmount('');
				} else {
					setQuoteCurrencyAmount(value);
					const baseAmount = toBigNumber(value).multipliedBy(rate);
					setBaseCurrencyAmount(baseAmount.dividedBy(MIN_SHORT_RATIO).toString());
				}
			}}
			walletBalance={quoteCurrencyBalance}
			onBalanceClick={() => {
				if (quoteCurrencyBalance != null) {
					setQuoteCurrencyAmount(quoteCurrencyBalance.toString());
					setBaseCurrencyAmount(quoteCurrencyBalance.multipliedBy(rate).toString());
				}
			}}
			priceRate={quotePriceRate}
			tradingMode="short"
		/>
	);

	const baseCurrencyCard = (
		<CurrencyCard
			side="base"
			currencyKey={baseCurrencyKey}
			amount={baseCurrencyAmount}
			onAmountChange={(value) => {
				if (value === '') {
					setBaseCurrencyAmount('');
					setQuoteCurrencyAmount('');
				} else {
					setBaseCurrencyAmount(value);
					setQuoteCurrencyAmount(
						toBigNumber(value).multipliedBy(inverseRate).multipliedBy(MIN_SHORT_RATIO).toString()
					);
				}
			}}
			walletBalance={baseCurrencyBalance}
			onBalanceClick={() => {
				if (baseCurrencyBalance != null) {
					setBaseCurrencyAmount(baseCurrencyBalance.toString());
					setQuoteCurrencyAmount(
						toBigNumber(baseCurrencyBalance).multipliedBy(inverseRate).toString()
					);
				}
			}}
			// onCurrencySelect={
			// 	allowBaseCurrencySelection ? () => setSelectBaseCurrencyModal(true) : undefined
			// }
			priceRate={basePriceRate}
			tradingMode="short"
		/>
	);

	const footerCard = (
		<>
			{!isWalletConnected ? (
				<ConnectWalletCard attached={true} />
			) : baseCurrencyMarketClosed.isMarketClosed || quoteCurrencyMarketClosed.isMarketClosed ? (
				<MarketClosureCard
					baseCurrencyMarketClosed={baseCurrencyMarketClosed}
					quoteCurrencyMarketClosed={quoteCurrencyMarketClosed}
					attached={true}
				/>
			) : noSynths ? (
				<NoSynthsCard attached={true} />
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
				/>
			)}
			{txConfirmationModalOpen && (
				<TxConfirmationModal
					onDismiss={() => setTxConfirmationModalOpen(false)}
					txError={txError}
					attemptRetry={handleSubmit}
					baseCurrencyAmount={baseCurrencyAmount}
					quoteCurrencyAmount={quoteCurrencyAmount}
					feeAmountInBaseCurrency={feeAmountInBaseCurrency}
					baseCurrencyKey={baseCurrencyKey!}
					quoteCurrencyKey={quoteCurrencyKey!}
					totalTradePrice={totalTradePrice.toString()}
					txProvider="synthetix"
				/>
			)}
		</>
	);

	return {
		baseCurrencyKey,
		quoteCurrencyKey,
		inverseRate,
		quoteCurrencyCard,
		baseCurrencyCard,
		footerCard,
	};
};

export default useExchange;
