import { useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { ethers, utils } from 'ethers';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import get from 'lodash/get';
import { Trans, useTranslation } from 'react-i18next';
import { Svg } from 'react-optimized-image';
import produce from 'immer';

import ArrowRightIcon from 'assets/svg/app/circle-arrow-right.svg';

import BigNumber from 'bignumber.js';

import { DEFAULT_TOKEN_DECIMALS } from 'constants/defaults';
import { CurrencyKey, SYNTHS_MAP } from 'constants/currency';

import useSynthsBalancesQuery from 'queries/walletBalances/useSynthsBalancesQuery';
import useEthGasPriceQuery from 'queries/network/useEthGasPriceQuery';
import useExchangeRatesQuery from 'queries/rates/useExchangeRatesQuery';
import useCollateralShortContractInfoQuery from 'queries/collateral/useCollateralShortContractInfoQuery';
import useCollateralShortRate from 'queries/collateral/useCollateralShortRate';

import CurrencyCard from 'sections/exchange/TradeCard/CurrencyCard';
import TradeSummaryCard from 'sections/exchange/FooterCard/TradeSummaryCard';
import NoSynthsCard from 'sections/exchange/FooterCard/NoSynthsCard';
import MarketClosureCard from 'sections/exchange/FooterCard/MarketClosureCard';
import ConnectWalletCard from 'sections/exchange/FooterCard/ConnectWalletCard';
import TxConfirmationModal from 'sections/shared/modals/TxConfirmationModal';
import TxApproveModal from 'sections/shared/modals/TxApproveModal';
import SelectShortCurrencyModal from 'sections/shared/modals/SelectShortCurrencyModal';
import useCurrencyPair from 'sections/exchange/hooks/useCurrencyPair';

import {
	customGasPriceState,
	gasSpeedState,
	isWalletConnectedState,
	walletAddressState,
} from 'store/wallet';
import { appReadyState } from 'store/app';
import { customShortCRatioState, shortCRatioState } from 'store/ui';

import { getExchangeRatesForCurrencies, synthToContractName } from 'utils/currencies';

import synthetix from 'lib/synthetix';

import useMarketClosed from 'hooks/useMarketClosed';
import useSelectedPriceCurrency from 'hooks/useSelectedPriceCurrency';

import { getTransactionPrice, normalizeGasLimit, gasPriceInWei } from 'utils/network';

import { toBigNumber, zeroBN, formatNumber } from 'utils/formatters/number';

import { NoTextTransform } from 'styles/common';
import { historicalShortsPositionState } from 'store/shorts';

import { SYNTHS_TO_SHORT } from '../constants';
import TransactionNotifier from 'containers/TransactionNotifier';

type ShortCardProps = {
	defaultBaseCurrencyKey?: CurrencyKey | null;
	defaultQuoteCurrencyKey?: CurrencyKey | null;
};

const useShort = ({
	defaultBaseCurrencyKey = null,
	defaultQuoteCurrencyKey = null,
}: ShortCardProps) => {
	const { t } = useTranslation();
	const { monitorTransaction } = TransactionNotifier.useContainer();

	const [currencyPair, setCurrencyPair] = useCurrencyPair({
		persistSelectedCurrencies: false,
		defaultBaseCurrencyKey,
		defaultQuoteCurrencyKey,
	});

	const { base: baseCurrencyKey, quote: quoteCurrencyKey } = currencyPair;

	const isAppReady = useRecoilValue(appReadyState);
	const [isApproving, setIsApproving] = useState<boolean>(false);
	const [isApproved, setIsApproved] = useState<boolean>(false);
	const [baseCurrencyAmount, setBaseCurrencyAmount] = useState<string>('');
	const [quoteCurrencyAmount, setQuoteCurrencyAmount] = useState<string>('');
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
	const isWalletConnected = useRecoilValue(isWalletConnectedState);
	const walletAddress = useRecoilValue(walletAddressState);
	const [txConfirmationModalOpen, setTxConfirmationModalOpen] = useState<boolean>(false);
	const [txApproveModalOpen, setTxApproveModalOpen] = useState<boolean>(false);
	const [selectShortCurrencyModalOpen, setSelectShortCurrencyModalOpen] = useState<boolean>(false);
	const [txError, setTxError] = useState<string | null>(null);
	const gasSpeed = useRecoilValue(gasSpeedState);
	const customGasPrice = useRecoilValue(customGasPriceState);
	const { selectPriceCurrencyRate, selectedPriceCurrency } = useSelectedPriceCurrency();
	const selectedShortCRatio = useRecoilValue(shortCRatioState);
	const customShortCRatio = useRecoilValue(customShortCRatioState);
	const setHistoricalShortPositions = useSetRecoilState(historicalShortsPositionState);

	const shortCRatio = useMemo(
		() => (customShortCRatio !== '' ? Number(customShortCRatio) / 100 : selectedShortCRatio),
		[customShortCRatio, selectedShortCRatio]
	);

	const [gasLimit, setGasLimit] = useState<number | null>(null);

	const synthsWalletBalancesQuery = useSynthsBalancesQuery();
	const ethGasPriceQuery = useEthGasPriceQuery();
	const exchangeRatesQuery = useExchangeRatesQuery();
	const collateralShortContractInfoQuery = useCollateralShortContractInfoQuery();
	const collateralShortRateQuery = useCollateralShortRate(baseCurrencyKey);

	const collateralShortContractInfo = collateralShortContractInfoQuery.isSuccess
		? collateralShortContractInfoQuery?.data ?? null
		: null;

	const issueFeeRate = collateralShortContractInfo?.issueFeeRate;
	const minCratio = collateralShortContractInfo?.minCollateralRatio;
	const minCollateral = collateralShortContractInfo?.minCollateral;

	const shortRate = collateralShortRateQuery.isSuccess
		? collateralShortRateQuery?.data ?? null
		: null;

	const shortCRatioTooLow = useMemo(
		() => (minCratio != null ? toBigNumber(shortCRatio).lt(minCratio) : false),
		[shortCRatio, minCratio]
	);

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

	const totalTradePrice = useMemo(() => {
		if (quoteCurrencyAmountBN.isNaN()) {
			return zeroBN;
		}
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

	const submissionDisabledReason: ReactNode = useMemo(() => {
		const insufficientBalance =
			quoteCurrencyBalance != null ? quoteCurrencyAmountBN.gt(quoteCurrencyBalance) : false;

		if (!selectedBothSides) {
			return t('exchange.summary-info.button.select-synth');
		}
		if (insufficientBalance) {
			return t('exchange.summary-info.button.insufficient-balance');
		}
		if (isSubmitting) {
			return t('exchange.summary-info.button.submitting-order');
		}
		if (isApproving) {
			return t('exchange.summary-info.button.approving');
		}
		if (
			!isWalletConnected ||
			baseCurrencyAmountBN.isNaN() ||
			quoteCurrencyAmountBN.isNaN() ||
			baseCurrencyAmountBN.lte(0) ||
			quoteCurrencyAmountBN.lte(0)
		) {
			return t('exchange.summary-info.button.enter-amount');
		}
		if (shortCRatioTooLow) {
			return t('shorting.shorting-card.summary-info.button.c-ratio-too-low');
		}
		if (minCollateral != null && quoteCurrencyAmountBN.lt(minCollateral)) {
			return (
				<span>
					<Trans
						t={t}
						i18nKey="shorting.shorting-card.summary-info.button.min-collateral"
						values={{ amount: formatNumber(minCollateral), currencyKey: quoteCurrencyKey }}
						components={[<span />, <NoTextTransform />]}
					/>
				</span>
			);
		}
		return null;
	}, [
		quoteCurrencyKey,
		shortCRatioTooLow,
		isApproving,
		quoteCurrencyBalance,
		selectedBothSides,
		isSubmitting,
		baseCurrencyAmountBN,
		quoteCurrencyAmountBN,
		isWalletConnected,
		minCollateral,
		t,
	]);

	const noSynths =
		synthsWalletBalancesQuery.isSuccess && synthsWalletBalancesQuery.data
			? synthsWalletBalancesQuery.data.balances.length === 0
			: false;

	// TODO: grab these from the smart contract
	const synthsAvailableToShort = useMemo(() => {
		if (isAppReady) {
			return synthetix.js!.synths.filter((synth) => SYNTHS_TO_SHORT.includes(synth.name));
		}
		return [];
	}, [isAppReady]);

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
		if (issueFeeRate != null && baseCurrencyAmount) {
			return toBigNumber(baseCurrencyAmount).multipliedBy(issueFeeRate);
		}
		return null;
	}, [baseCurrencyAmount, issueFeeRate]);

	const feeCost = useMemo(() => {
		if (feeAmountInBaseCurrency != null) {
			return feeAmountInBaseCurrency.multipliedBy(basePriceRate);
		}
		return null;
	}, [feeAmountInBaseCurrency, basePriceRate]);

	const checkAllowance = useCallback(async () => {
		if (isWalletConnected && quoteCurrencyKey != null && quoteCurrencyAmount) {
			try {
				const { contracts } = synthetix.js!;

				const allowance = (await contracts[synthToContractName(quoteCurrencyKey)].allowance(
					walletAddress,
					contracts.CollateralShort.address
				)) as ethers.BigNumber;

				setIsApproved(toBigNumber(ethers.utils.formatEther(allowance)).gte(quoteCurrencyAmount));
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

	function resetCurrencies() {
		setQuoteCurrencyAmount('');
		setBaseCurrencyAmount('');
	}

	useEffect(() => {
		resetCurrencies();
	}, [shortCRatio]);

	const getShortParams = () => {
		return [
			ethers.utils.parseUnits(
				quoteCurrencyAmountBN.decimalPlaces(DEFAULT_TOKEN_DECIMALS).toString(),
				DEFAULT_TOKEN_DECIMALS
			),
			ethers.utils.parseUnits(
				baseCurrencyAmountBN.decimalPlaces(DEFAULT_TOKEN_DECIMALS).toString(),
				DEFAULT_TOKEN_DECIMALS
			),
			ethers.utils.formatBytes32String(baseCurrencyKey!),
		];
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

	const handleApprove = async () => {
		if (quoteCurrencyKey != null && gasPrice != null) {
			setTxError(null);
			setTxApproveModalOpen(true);

			try {
				setIsApproving(true);
				// open approve modal

				const { contracts } = synthetix.js!;

				const collateralContract = contracts[synthToContractName(quoteCurrencyKey)];

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
					monitorTransaction({
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

	const onLoanCreated = useCallback(
		async (
			_owner: string,
			loanId: ethers.BigNumber,
			amount: ethers.BigNumber,
			collateral: ethers.BigNumber,
			currency: string,
			_issueFee: ethers.BigNumber,
			tx: ethers.Event
		) => {
			if (synthetix.js != null) {
				// const { CollateralShort } = synthetix.js.contracts;

				setHistoricalShortPositions((orders) =>
					produce(orders, (draftState) => {
						draftState.push({
							id: loanId.toString(),
							accruedInterest: toBigNumber(0),
							synthBorrowed: utils.parseBytes32String(currency),
							synthBorrowedAmount: toBigNumber(utils.formatUnits(amount, DEFAULT_TOKEN_DECIMALS)),
							collateralLocked: SYNTHS_MAP.sUSD,
							collateralLockedAmount: toBigNumber(
								utils.formatUnits(collateral, DEFAULT_TOKEN_DECIMALS)
							),
							txHash: tx.transactionHash,
							isOpen: true,
							createdAt: new Date(),
							closedAt: null,
							profitLoss: null,
						});
					})
				);
			}
		},
		[setHistoricalShortPositions]
	);

	const handleSubmit = async () => {
		if (synthetix.js != null && gasPrice != null) {
			setTxError(null);
			setTxConfirmationModalOpen(true);

			const { CollateralShort } = synthetix.js.contracts;

			try {
				setIsSubmitting(true);

				let tx: ethers.ContractTransaction | null = null;

				const gasPriceWei = gasPriceInWei(gasPrice);

				const gasLimitEstimate = await getGasLimitEstimateForShort();

				setGasLimit(gasLimitEstimate);

				tx = (await CollateralShort.open(...getShortParams(), {
					gasPrice: gasPriceWei,
					gasLimit: gasLimitEstimate,
				})) as ethers.ContractTransaction;

				if (tx != null) {
					monitorTransaction({
						txHash: tx.hash,
						onTxConfirmed: () => {
							synthsWalletBalancesQuery.refetch();
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

	useEffect(() => {
		const unsubs: Function[] = [];

		if (isAppReady && walletAddress != null) {
			const { CollateralShort } = synthetix.js!.contracts;

			const loanCreatedEvent = CollateralShort.filters.LoanCreated(walletAddress);

			CollateralShort.on(loanCreatedEvent, onLoanCreated);
			unsubs.push(() => CollateralShort.off(loanCreatedEvent, onLoanCreated));
		}
		return () => {
			unsubs.forEach((unsub) => unsub());
		};
	}, [isAppReady, walletAddress, onLoanCreated]);

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
					setBaseCurrencyAmount(
						toBigNumber(value)
							.multipliedBy(rate)
							.dividedBy(shortCRatio)
							.decimalPlaces(DEFAULT_TOKEN_DECIMALS)
							.toString()
					);
				}
			}}
			walletBalance={quoteCurrencyBalance}
			onBalanceClick={() => {
				if (quoteCurrencyBalance != null) {
					setQuoteCurrencyAmount(quoteCurrencyBalance.toString());
					setBaseCurrencyAmount(
						quoteCurrencyBalance
							.multipliedBy(rate)
							.dividedBy(shortCRatio)
							.decimalPlaces(DEFAULT_TOKEN_DECIMALS)
							.toString()
					);
				}
			}}
			priceRate={quotePriceRate}
			label={t('shorting.common.collateral')}
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
						toBigNumber(value)
							.multipliedBy(inverseRate)
							.multipliedBy(shortCRatio)
							.decimalPlaces(DEFAULT_TOKEN_DECIMALS)
							.toString()
					);
				}
			}}
			walletBalance={baseCurrencyBalance}
			onBalanceClick={() => {
				if (baseCurrencyBalance != null) {
					setBaseCurrencyAmount(baseCurrencyBalance.toString());
					setQuoteCurrencyAmount(
						toBigNumber(baseCurrencyBalance)
							.multipliedBy(inverseRate)
							.multipliedBy(shortCRatio)
							.decimalPlaces(DEFAULT_TOKEN_DECIMALS)
							.toString()
					);
				}
			}}
			onCurrencySelect={() => setSelectShortCurrencyModalOpen(true)}
			priceRate={basePriceRate}
			label={t('shorting.common.shorting')}
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
					quoteCurrencyKey={quoteCurrencyKey}
					baseCurrencyKey={baseCurrencyKey}
				/>
			) : noSynths ? (
				<NoSynthsCard attached={true} />
			) : (
				<TradeSummaryCard
					attached={true}
					submissionDisabledReason={submissionDisabledReason}
					onSubmit={isApproved ? handleSubmit : handleApprove}
					totalTradePrice={totalTradePrice.toString()}
					baseCurrencyAmount={baseCurrencyAmount}
					basePriceRate={basePriceRate}
					baseCurrency={baseCurrency}
					gasPrices={ethGasPriceQuery.data}
					feeReclaimPeriodInSeconds={0}
					quoteCurrencyKey={quoteCurrencyKey}
					feeRate={issueFeeRate ?? null}
					transactionFee={transactionFee}
					feeCost={feeCost}
					showFee={true}
					isApproved={isApproved}
					isCreateShort={true}
					shortInterestRate={shortRate}
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
			{txApproveModalOpen && (
				<TxApproveModal
					onDismiss={() => setTxApproveModalOpen(false)}
					txError={txError}
					attemptRetry={handleApprove}
					currencyKey={quoteCurrencyKey!}
					currencyLabel={<NoTextTransform>{quoteCurrencyKey}</NoTextTransform>}
				/>
			)}
			{selectShortCurrencyModalOpen && quoteCurrencyKey != null && (
				<SelectShortCurrencyModal
					onDismiss={() => setSelectShortCurrencyModalOpen(false)}
					onSelect={(currencyKey) => {
						resetCurrencies();
						// @ts-ignore
						setCurrencyPair((pair) => ({
							base: currencyKey,
							quote: pair.quote === currencyKey ? null : pair.quote,
						}));
					}}
					synths={synthsAvailableToShort}
					collateralCurrencyKey={quoteCurrencyKey}
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

export default useShort;
