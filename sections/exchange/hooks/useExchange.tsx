import { useState, useEffect, useMemo } from 'react';
import { ethers } from 'ethers';
import { useRouter } from 'next/router';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import get from 'lodash/get';
import produce from 'immer';
import castArray from 'lodash/castArray';
import BigNumber from 'bignumber.js';

import ROUTES from 'constants/routes';
import { CRYPTO_CURRENCY_MAP, CurrencyKey, SYNTHS_MAP } from 'constants/currency';

import Connector from 'containers/Connector';
import Etherscan from 'containers/Etherscan';

import useSynthsBalancesQuery from 'queries/walletBalances/useSynthsBalancesQuery';
import useETHBalanceQuery from 'queries/walletBalances/useETHBalanceQuery';
import useEthGasPriceQuery from 'queries/network/useEthGasPriceQuery';
import useExchangeRatesQuery from 'queries/rates/useExchangeRatesQuery';

import CurrencyCard from 'sections/exchange/TradeCard/CurrencyCard';
import PriceChartCard from 'sections/exchange/TradeCard/PriceChartCard';
import MarketDetailsCard from 'sections/exchange/TradeCard/MarketDetailsCard';
import TradeSummaryCard from 'sections/exchange/FooterCard/TradeSummaryCard';
import { SubmissionDisabledReason } from 'sections/exchange/FooterCard/common';
import NoSynthsCard from 'sections/exchange/FooterCard/NoSynthsCard';
import MarketClosureCard from 'sections/exchange/FooterCard/MarketClosureCard';
import TradeBalancerFooterCard from 'sections/exchange/FooterCard/TradeBalancerFooterCard';
import ConnectWalletCard from 'sections/exchange/FooterCard/ConnectWalletCard';
import TxConfirmationModal from 'sections/shared/modals/TxConfirmationModal';
import SelectBaseCurrencyModal from 'sections/shared/modals/SelectBaseCurrencyModal';
import SelectQuoteCurrencyModal from 'sections/shared/modals/SelectQuoteCurrencyModal';
import BalancerTradeModal from 'sections/shared/modals/BalancerTradeModal';

import { hasOrdersNotificationState } from 'store/ui';
import {
	customGasPriceState,
	gasSpeedState,
	isWalletConnectedState,
	walletAddressState,
} from 'store/wallet';
import { ordersState } from 'store/orders';

import { getExchangeRatesForCurrencies } from 'utils/currencies';

import synthetix from 'lib/synthetix';

import useFeeReclaimPeriodQuery from 'queries/synths/useFeeReclaimPeriodQuery';
import useExchangeFeeRate from 'queries/synths/useExchangeFeeRate';
import { getTransactionPrice, normalizeGasLimit, gasPriceInWei } from 'utils/network';
import useSelectedPriceCurrency from 'hooks/useSelectedPriceCurrency';
import useMarketClosed from 'hooks/useMarketClosed';
import OneInch from 'containers/OneInch';
import useCurrencyPair from './useCurrencyPair';
import { toBigNumber, zeroBN } from 'utils/formatters/number';

type ExchangeCardProps = {
	defaultBaseCurrencyKey?: CurrencyKey | null;
	defaultQuoteCurrencyKey?: CurrencyKey | null;
	showPriceCard?: boolean;
	showMarketDetailsCard?: boolean;
	footerCardAttached?: boolean;
	routingEnabled?: boolean;
	persistSelectedCurrencies?: boolean;
	allowCurrencySelection?: boolean;
	showNoSynthsCard?: boolean;
};

const useExchange = ({
	defaultBaseCurrencyKey = null,
	defaultQuoteCurrencyKey = null,
	showPriceCard = false,
	showMarketDetailsCard = false,
	footerCardAttached = false,
	routingEnabled = false,
	persistSelectedCurrencies = false,
	allowCurrencySelection = true,
	showNoSynthsCard = true,
}: ExchangeCardProps) => {
	const { notify } = Connector.useContainer();
	const { etherscanInstance } = Etherscan.useContainer();
	const { swap } = OneInch.useContainer();
	const router = useRouter();

	const marketQuery = useMemo(
		() => (router.query.market ? castArray(router.query.market)[0] : null),
		[router.query]
	);

	const [currencyPair, setCurrencyPair] = useCurrencyPair({
		persistSelectedCurrencies,
		defaultBaseCurrencyKey,
		defaultQuoteCurrencyKey,
	});
	const [baseCurrencyAmount, setBaseCurrencyAmount] = useState<string>('');
	const [quoteCurrencyAmount, setQuoteCurrencyAmount] = useState<string>('');
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
	const isWalletConnected = useRecoilValue(isWalletConnectedState);
	const walletAddress = useRecoilValue(walletAddressState);
	const [txConfirmationModalOpen, setTxConfirmationModalOpen] = useState<boolean>(false);
	const [selectBaseCurrencyModal, setSelectBaseCurrencyModal] = useState<boolean>(false);
	const [selectQuoteCurrencyModalOpen, setSelectQuoteCurrencyModalOpen] = useState<boolean>(false);
	const [selectBalancerTradeModal, setSelectBalancerTradeModal] = useState<boolean>(false);
	const [txError, setTxError] = useState<boolean>(false);
	const setOrders = useSetRecoilState(ordersState);
	const setHasOrdersNotification = useSetRecoilState(hasOrdersNotificationState);
	const gasSpeed = useRecoilValue(gasSpeedState);
	const customGasPrice = useRecoilValue(customGasPriceState);
	const { selectPriceCurrencyRate, selectedPriceCurrency } = useSelectedPriceCurrency();

	const [gasLimit, setGasLimit] = useState<number | null>(null);

	const { base: baseCurrencyKey, quote: quoteCurrencyKey } = currencyPair;

	const isQuoteCurrencyETH = quoteCurrencyKey === CRYPTO_CURRENCY_MAP.ETH;
	const ETHBalanceQuery = useETHBalanceQuery();
	const synthsWalletBalancesQuery = useSynthsBalancesQuery();
	const ethGasPriceQuery = useEthGasPriceQuery();
	const exchangeRatesQuery = useExchangeRatesQuery();
	const feeReclaimPeriodQuery = useFeeReclaimPeriodQuery(quoteCurrencyKey);
	const exchangeFeeRateQuery = useExchangeFeeRate(quoteCurrencyKey, baseCurrencyKey);

	const exchangeFeeRate = exchangeFeeRateQuery.isSuccess ? exchangeFeeRateQuery.data ?? null : null;

	const feeReclaimPeriodInSeconds = feeReclaimPeriodQuery.isSuccess
		? feeReclaimPeriodQuery.data ?? 0
		: 0;

	const baseCurrency =
		baseCurrencyKey != null && synthetix.synthsMap != null
			? synthetix.synthsMap[baseCurrencyKey]
			: null;
	// const quoteCurrency =
	// 	quoteCurrencyKey != null && synthetix.synthsMap != null
	// 		? synthetix.synthsMap[quoteCurrencyKey]
	// 		: null;
	const exchangeRates = exchangeRatesQuery.isSuccess ? exchangeRatesQuery.data ?? null : null;
	const rate = getExchangeRatesForCurrencies(exchangeRates, quoteCurrencyKey, baseCurrencyKey);
	const inverseRate = rate > 0 ? 1 / rate : 0;
	const baseCurrencyBalance =
		baseCurrencyKey != null && synthsWalletBalancesQuery.isSuccess
			? get(synthsWalletBalancesQuery.data, ['balancesMap', baseCurrencyKey, 'balance'], zeroBN)
			: null;

	let quoteCurrencyBalance: BigNumber | null = null;
	if (quoteCurrencyKey != null) {
		if (isQuoteCurrencyETH) {
			quoteCurrencyBalance = ETHBalanceQuery.isSuccess ? ETHBalanceQuery.data ?? zeroBN : null;
		} else {
			quoteCurrencyBalance = synthsWalletBalancesQuery.isSuccess
				? get(synthsWalletBalancesQuery.data, ['balancesMap', quoteCurrencyKey, 'balance'], zeroBN)
				: null;
		}
	}

	const basePriceRate = getExchangeRatesForCurrencies(
		exchangeRates,
		baseCurrencyKey,
		selectedPriceCurrency.name
	);
	const quotePriceRate = getExchangeRatesForCurrencies(
		exchangeRates,
		quoteCurrencyKey,
		selectedPriceCurrency.name
	);
	const ethPriceRate = getExchangeRatesForCurrencies(
		exchangeRates,
		SYNTHS_MAP.sETH,
		selectedPriceCurrency.name
	);

	const baseCurrencyAmountBN = toBigNumber(baseCurrencyAmount);
	const quoteCurrencyAmountBN = toBigNumber(quoteCurrencyAmount);

	let totalTradePrice = baseCurrencyAmountBN.multipliedBy(basePriceRate);
	if (selectPriceCurrencyRate) {
		totalTradePrice = totalTradePrice.dividedBy(selectPriceCurrencyRate);
	}

	const selectedBothSides = baseCurrencyKey != null && quoteCurrencyKey != null;

	const baseCurrencyMarketClosed = useMarketClosed(baseCurrencyKey);
	const quoteCurrencyMarketClosed = useMarketClosed(quoteCurrencyKey);

	const submissionDisabledReason: SubmissionDisabledReason | null = useMemo(() => {
		const insufficientBalance =
			quoteCurrencyBalance != null ? quoteCurrencyAmountBN.gt(quoteCurrencyBalance) : false;

		if (feeReclaimPeriodInSeconds > 0) {
			return 'fee-reclaim-period';
		}
		if (!selectedBothSides) {
			return 'select-synth';
		}
		if (insufficientBalance) {
			return 'insufficient-balance';
		}
		if (isSubmitting) {
			return 'submitting-order';
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
		quoteCurrencyBalance,
		selectedBothSides,
		isSubmitting,
		feeReclaimPeriodInSeconds,
		baseCurrencyAmountBN,
		quoteCurrencyAmountBN,
		isWalletConnected,
	]);

	const noSynths =
		synthsWalletBalancesQuery.isSuccess && synthsWalletBalancesQuery.data
			? synthsWalletBalancesQuery.data.balances.length === 0
			: false;

	const routeToMarketPair = (baseCurrencyKey: CurrencyKey, quoteCurrencyKey: CurrencyKey) =>
		routingEnabled
			? router.replace(
					`/exchange/[[...market]]`,
					ROUTES.Exchange.MarketPair(baseCurrencyKey, quoteCurrencyKey),
					{
						shallow: true,
					}
			  )
			: undefined;

	const routeToBaseCurrency = (baseCurrencyKey: CurrencyKey) =>
		routingEnabled
			? router.replace(`/exchange/[[...market]]`, ROUTES.Exchange.Into(baseCurrencyKey), {
					shallow: true,
			  })
			: false;

	const handleCurrencySwap = () => {
		const baseAmount = baseCurrencyAmount;
		const quoteAmount = quoteCurrencyAmount;

		setCurrencyPair({
			base: quoteCurrencyKey,
			quote: baseCurrencyKey,
		});

		setBaseCurrencyAmount(quoteAmount);
		setQuoteCurrencyAmount(baseAmount);

		if (quoteCurrencyKey != null && baseCurrencyKey != null) {
			routeToMarketPair(quoteCurrencyKey, baseCurrencyKey);
		}
	};

	function resetCurrencies() {
		setQuoteCurrencyAmount('');
		setBaseCurrencyAmount('');
	}

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
		if (exchangeFeeRate != null && baseCurrencyAmount) {
			return toBigNumber(baseCurrencyAmount).multipliedBy(exchangeFeeRate);
		}
		return null;
	}, [baseCurrencyAmount, exchangeFeeRate]);

	const feeCost = useMemo(() => {
		if (feeAmountInBaseCurrency != null) {
			return feeAmountInBaseCurrency.multipliedBy(basePriceRate);
		}
		return null;
	}, [feeAmountInBaseCurrency, basePriceRate]);

	// An attempt to show correct gas fees while making as few calls as possible. (as soon as the submission is "valid", compute it once)
	useEffect(() => {
		const getGasLimitEstimate = async () => {
			if (gasLimit == null && submissionDisabledReason == null) {
				const gasLimitEstimate = await getGasLimitEstimateForExchange();
				setGasLimit(gasLimitEstimate);
			}
		};
		getGasLimitEstimate();
		// eslint-disable-next-line
	}, [submissionDisabledReason, gasLimit]);

	// reset estimated gas limit when currencies are changed.
	useEffect(() => {
		setGasLimit(null);
	}, [baseCurrencyKey, quoteCurrencyKey]);

	const getExchangeParams = () => {
		const quoteKeyBytes32 = ethers.utils.formatBytes32String(quoteCurrencyKey!);
		const baseKeyBytes32 = ethers.utils.formatBytes32String(baseCurrencyKey!);
		const amountToExchange = ethers.utils.parseEther(quoteCurrencyAmount);
		const trackingCode = ethers.utils.formatBytes32String('KWENTA');

		return [quoteKeyBytes32, amountToExchange, baseKeyBytes32, walletAddress, trackingCode];
	};

	const getGasLimitEstimateForExchange = async () => {
		try {
			if (synthetix.js != null) {
				const exchangeParams = getExchangeParams();
				const gasEstimate = await synthetix.js.contracts.Synthetix.estimateGas.exchangeWithTracking(
					...exchangeParams
				);

				return normalizeGasLimit(Number(gasEstimate));
			}
		} catch (e) {
			console.log(e);
		}
		return null;
	};

	const handleSubmit = async () => {
		if (synthetix.js != null && gasPrice != null) {
			setTxError(false);
			setTxConfirmationModalOpen(true);
			const exchangeParams = getExchangeParams();

			try {
				setIsSubmitting(true);

				let tx: ethers.ContractTransaction;

				const gasPriceWei = gasPriceInWei(gasPrice);

				if (isQuoteCurrencyETH) {
					tx = await swap(quoteCurrencyAmount, gasPriceWei);
				} else {
					const gasLimitEstimate = await getGasLimitEstimateForExchange();

					setGasLimit(gasLimitEstimate);

					tx = await synthetix.js.contracts.Synthetix.exchangeWithTracking(...exchangeParams, {
						gasPrice: gasPriceWei,
						gasLimit: gasLimitEstimate,
					});
				}

				if (tx) {
					setOrders((orders) =>
						produce(orders, (draftState) => {
							draftState.push({
								timestamp: Date.now(),
								hash: tx.hash,
								baseCurrencyKey: baseCurrencyKey!,
								baseCurrencyAmount,
								quoteCurrencyKey: quoteCurrencyKey!,
								quoteCurrencyAmount,
								orderType: 'market',
								status: 'pending',
								transaction: tx,
							});
						})
					);
					setHasOrdersNotification(true);

					if (notify) {
						const { emitter } = notify.hash(tx.hash);
						const link = etherscanInstance != null ? etherscanInstance.txLink(tx.hash) : undefined;

						emitter.on('txConfirmed', () => {
							setOrders((orders) =>
								produce(orders, (draftState) => {
									const orderIndex = orders.findIndex((order) => order.hash === tx.hash);
									if (draftState[orderIndex]) {
										draftState[orderIndex].status = 'confirmed';
									}
								})
							);
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

	useEffect(() => {
		if (routingEnabled && marketQuery != null) {
			if (synthetix.synthsMap != null) {
				const [baseCurrencyFromQuery, quoteCurrencyFromQuery] = marketQuery.split('-') as [
					CurrencyKey,
					CurrencyKey
				];

				const validBaseCurrency =
					baseCurrencyFromQuery != null && synthetix.synthsMap[baseCurrencyFromQuery] != null;
				const validQuoteCurrency =
					quoteCurrencyFromQuery != null && synthetix.synthsMap[quoteCurrencyFromQuery] != null;

				if (validBaseCurrency && validQuoteCurrency) {
					setCurrencyPair({
						base: baseCurrencyFromQuery,
						quote: quoteCurrencyFromQuery,
					});
				} else if (validBaseCurrency) {
					setCurrencyPair({
						base: baseCurrencyFromQuery,
						quote: null,
					});
				}
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [marketQuery, routingEnabled]);

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
					setBaseCurrencyAmount(toBigNumber(value).multipliedBy(rate).toString());
				}
			}}
			walletBalance={quoteCurrencyBalance}
			onBalanceClick={() => {
				if (quoteCurrencyBalance != null) {
					setQuoteCurrencyAmount(quoteCurrencyBalance.toString());
					setBaseCurrencyAmount(quoteCurrencyBalance.multipliedBy(rate).toString());
				}
			}}
			onCurrencySelect={
				allowCurrencySelection ? () => setSelectQuoteCurrencyModalOpen(true) : undefined
			}
			priceRate={quotePriceRate}
		/>
	);
	const quotePriceChartCard = showPriceCard ? (
		<PriceChartCard
			side="quote"
			currencyKey={quoteCurrencyKey}
			openAfterHoursModalCallback={() => setSelectBalancerTradeModal(true)}
			priceRate={quotePriceRate}
		/>
	) : null;

	const quoteMarketDetailsCard = showMarketDetailsCard ? (
		<MarketDetailsCard currencyKey={quoteCurrencyKey} priceRate={quotePriceRate} />
	) : null;

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
					setQuoteCurrencyAmount(toBigNumber(value).multipliedBy(inverseRate).toString());
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
			onCurrencySelect={allowCurrencySelection ? () => setSelectBaseCurrencyModal(true) : undefined}
			priceRate={basePriceRate}
		/>
	);

	const basePriceChartCard = showPriceCard ? (
		<PriceChartCard
			side="base"
			currencyKey={baseCurrencyKey}
			priceRate={basePriceRate}
			openAfterHoursModalCallback={() => setSelectBalancerTradeModal(true)}
		/>
	) : null;

	const baseMarketDetailsCard = showMarketDetailsCard ? (
		<MarketDetailsCard currencyKey={baseCurrencyKey} priceRate={basePriceRate} />
	) : null;

	// TODO: support more providers
	const txProvider = isQuoteCurrencyETH ? '1inch' : 'synthetix';

	const footerCard = (
		<>
			{!isWalletConnected ? (
				<ConnectWalletCard attached={footerCardAttached} />
			) : (baseCurrencyMarketClosed.isMarketClosed && baseCurrencyKey === SYNTHS_MAP.iBNB) ||
			  (quoteCurrencyMarketClosed.isMarketClosed && quoteCurrencyKey === SYNTHS_MAP.iBNB) ? (
				<TradeBalancerFooterCard
					synth={SYNTHS_MAP.sTSLA}
					attached={footerCardAttached}
					onClick={() => setSelectBalancerTradeModal(true)}
				/>
			) : baseCurrencyMarketClosed.isMarketClosed || quoteCurrencyMarketClosed.isMarketClosed ? (
				<MarketClosureCard
					baseCurrencyMarketClosed={baseCurrencyMarketClosed}
					quoteCurrencyMarketClosed={quoteCurrencyMarketClosed}
					attached={footerCardAttached}
				/>
			) : showNoSynthsCard && noSynths ? (
				<NoSynthsCard attached={footerCardAttached} />
			) : (
				<TradeSummaryCard
					attached={footerCardAttached}
					submissionDisabledReason={submissionDisabledReason}
					onSubmit={handleSubmit}
					totalTradePrice={totalTradePrice.toString()}
					baseCurrencyAmount={baseCurrencyAmount}
					basePriceRate={basePriceRate}
					baseCurrency={baseCurrency}
					gasPrices={ethGasPriceQuery.data}
					feeReclaimPeriodInSeconds={feeReclaimPeriodInSeconds}
					quoteCurrencyKey={quoteCurrencyKey}
					exchangeFeeRate={exchangeFeeRate}
					transactionFee={transactionFee}
					feeCost={feeCost}
					// show fee's only for "synthetix" (provider)
					showFee={txProvider === 'synthetix' ? true : false}
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
					txProvider={txProvider}
				/>
			)}
			{selectBaseCurrencyModal && (
				<SelectBaseCurrencyModal
					onDismiss={() => setSelectBaseCurrencyModal(false)}
					onSelect={(currencyKey) => {
						resetCurrencies();
						// @ts-ignore
						setCurrencyPair((pair) => ({
							base: currencyKey,
							quote: pair.quote === currencyKey ? null : pair.quote,
						}));

						if (currencyPair.quote != null) {
							if (currencyPair.quote !== currencyKey) {
								routeToMarketPair(currencyKey, currencyPair.quote);
							}
						} else {
							routeToBaseCurrency(currencyKey);
						}
					}}
				/>
			)}
			{selectQuoteCurrencyModalOpen && (
				<SelectQuoteCurrencyModal
					onDismiss={() => setSelectQuoteCurrencyModalOpen(false)}
					onSelect={(currencyKey) => {
						resetCurrencies();
						// @ts-ignore
						setCurrencyPair((pair) => ({
							base: pair.base === currencyKey ? null : pair.base,
							quote: currencyKey,
						}));
						if (currencyPair.base && currencyPair.base !== currencyKey) {
							routeToMarketPair(currencyPair.base, currencyKey);
						}
					}}
				/>
			)}
			{selectBalancerTradeModal && (
				<BalancerTradeModal onDismiss={() => setSelectBalancerTradeModal(false)} />
			)}
		</>
	);

	return {
		baseCurrencyKey,
		quoteCurrencyKey,
		inverseRate,
		quoteCurrencyCard,
		quotePriceChartCard,
		quoteMarketDetailsCard,
		baseCurrencyCard,
		basePriceChartCard,
		baseMarketDetailsCard,
		footerCard,
		handleCurrencySwap,
	};
};

export default useExchange;
