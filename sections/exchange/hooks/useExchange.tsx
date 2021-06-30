import { useState, useEffect, useMemo, useCallback } from 'react';
import { ethers } from 'ethers';
import { useRouter } from 'next/router';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import get from 'lodash/get';
import produce from 'immer';
import castArray from 'lodash/castArray';
import { useTranslation } from 'react-i18next';
import { Svg } from 'react-optimized-image';

import ArrowsIcon from 'assets/svg/app/circle-arrows.svg';

import Convert from 'containers/Convert';

import ROUTES from 'constants/routes';
import { DEFAULT_TOKEN_DECIMALS } from 'constants/defaults';
import {
	AFTER_HOURS_SYNTHS,
	CRYPTO_CURRENCY_MAP,
	CurrencyKey,
	ETH_ADDRESS,
	SYNTHS,
	SYNTHS_MAP,
} from 'constants/currency';
import { Period } from 'constants/period';
import { ChartType } from 'constants/chartType';

import useSynthsBalancesQuery from 'queries/walletBalances/useSynthsBalancesQuery';
import useETHBalanceQuery from 'queries/walletBalances/useETHBalanceQuery';
import useEthGasPriceQuery from 'queries/network/useEthGasPriceQuery';
import useExchangeRatesQuery from 'queries/rates/useExchangeRatesQuery';
import useFeeReclaimPeriodQuery from 'queries/synths/useFeeReclaimPeriodQuery';
import useExchangeFeeRate from 'queries/synths/useExchangeFeeRate';
import use1InchQuoteQuery from 'queries/1inch/use1InchQuoteQuery';
import useTokensBalancesQuery from 'queries/walletBalances/useTokensBalancesQuery';
import use1InchApproveSpenderQuery from 'queries/1inch/use1InchApproveAddressQuery';
import useCoinGeckoTokenPricesQuery from 'queries/coingecko/useCoinGeckoTokenPricesQuery';

import CurrencyCard from 'sections/exchange/TradeCard/CurrencyCard';
import PriceChartCard from 'sections/exchange/TradeCard/Charts/PriceChartCard';
import CombinedPriceChartCard from 'sections/exchange/TradeCard/Charts/CombinedPriceChartCard';
import MarketDetailsCard from 'sections/exchange/TradeCard/Cards/MarketDetailsCard';
import CombinedMarketDetailsCard from 'sections/exchange/TradeCard/Cards/CombinedMarketDetailsCard';
import TradeSummaryCard from 'sections/exchange/FooterCard/TradeSummaryCard';
import NoSynthsCard from 'sections/exchange/FooterCard/NoSynthsCard';
import GetL2GasCard from 'sections/exchange/FooterCard/GetL2GasCard';
import MarketClosureCard from 'sections/exchange/FooterCard/MarketClosureCard';
import TradeBalancerFooterCard from 'sections/exchange/FooterCard/TradeBalancerFooterCard';
import ConnectWalletCard from 'sections/exchange/FooterCard/ConnectWalletCard';
import L2TradingIncentiveCard from 'sections/exchange/FooterCard/L2TradingIncentiveCard';

import TxConfirmationModal from 'sections/shared/modals/TxConfirmationModal';
import { TxProvider } from 'sections/shared/modals/TxConfirmationModal/TxConfirmationModal';
import SelectCurrencyModal from 'sections/shared/modals/SelectCurrencyModal';
import SelectTokenModal from 'sections/shared/modals/SelectTokenModal';
import TxApproveModal from 'sections/shared/modals/TxApproveModal';
import BalancerTradeModal from 'sections/shared/modals/BalancerTradeModal';

import useChartWideWidth from 'sections/exchange/hooks/useChartWideWidth';
import useSelectedPriceCurrency from 'hooks/useSelectedPriceCurrency';
import useMarketClosed from 'hooks/useMarketClosed';
import useDebouncedMemo from 'hooks/useDebouncedMemo';
import usePersistedRecoilState from 'hooks/usePersistedRecoilState';

import { hasOrdersNotificationState, slippageState } from 'store/ui';
import {
	singleChartPeriodState,
	baseChartPeriodState,
	quoteChartPeriodState,
	singleChartTypeState,
	baseChartTypeState,
	quoteChartTypeState,
} from 'store/app';
import {
	customGasPriceState,
	gasSpeedState,
	isWalletConnectedState,
	walletAddressState,
	isL2State,
} from 'store/wallet';
import { ordersState } from 'store/orders';

import { getExchangeRatesForCurrencies } from 'utils/currencies';
import { toBigNumber, zeroBN } from 'utils/formatters/number';

import synthetix from 'lib/synthetix';

import { getTransactionPrice, normalizeGasLimit, gasPriceInWei } from 'utils/network';

import useCurrencyPair from './useCurrencyPair';
import TransactionNotifier from 'containers/TransactionNotifier';
import L2Gas from 'containers/L2Gas';
// import useCMCQuotesQuery from 'queries/cmc/useCMCQuotesQuery';

import { NoTextTransform } from 'styles/common';
import useZapperTokenList from 'queries/tokenLists/useZapperTokenList';

type ExchangeCardProps = {
	defaultBaseCurrencyKey?: CurrencyKey | null;
	defaultQuoteCurrencyKey?: CurrencyKey | null;
	showPriceCard?: boolean;
	showMarketDetailsCard?: boolean;
	footerCardAttached?: boolean;
	routingEnabled?: boolean;
	persistSelectedCurrencies?: boolean;
	allowQuoteCurrencySelection?: boolean;
	allowBaseCurrencySelection?: boolean;
	showNoSynthsCard?: boolean;
	txProvider?: TxProvider;
};

const useExchange = ({
	defaultBaseCurrencyKey = null,
	defaultQuoteCurrencyKey = null,
	showPriceCard = false,
	showMarketDetailsCard = false,
	footerCardAttached = false,
	routingEnabled = false,
	persistSelectedCurrencies = false,
	allowQuoteCurrencySelection = true,
	allowBaseCurrencySelection = true,
	showNoSynthsCard = true,
	txProvider = 'synthetix',
}: ExchangeCardProps) => {
	const { t } = useTranslation();
	const { monitorTransaction } = TransactionNotifier.useContainer();
	const { hasNone: hasNoL2Gas } = L2Gas.useContainer();

	const { createERC20Contract, swap1Inch } = Convert.useContainer();
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
	const [isApproving, setIsApproving] = useState<boolean>(false);
	const [isApproved, setIsApproved] = useState<boolean>(false);
	const [baseCurrencyAmount, setBaseCurrencyAmount] = useState<string>('');
	const [quoteCurrencyAmount, setQuoteCurrencyAmount] = useState<string>('');
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
	const isWalletConnected = useRecoilValue(isWalletConnectedState);
	const walletAddress = useRecoilValue(walletAddressState);
	const isL2 = useRecoilValue(isL2State);
	const [txConfirmationModalOpen, setTxConfirmationModalOpen] = useState<boolean>(false);
	const [txError, setTxError] = useState<string | null>(null);
	const [selectBaseCurrencyModalOpen, setSelectBaseCurrencyModalOpen] = useState<boolean>(false);
	const [selectQuoteCurrencyModalOpen, setSelectQuoteCurrencyModalOpen] = useState<boolean>(false);
	const [selectBalancerTradeModal, setSelectBalancerTradeModal] = useState<boolean>(false);
	const [selectQuoteTokenModalOpen, setSelectQuoteTokenModalOpen] = useState<boolean>(false);
	const [selectBaseTokenModalOpen, setSelectBaseTokenModalOpen] = useState<boolean>(false);
	const [txApproveModalOpen, setTxApproveModalOpen] = useState<boolean>(false);
	const setOrders = useSetRecoilState(ordersState);
	const setHasOrdersNotification = useSetRecoilState(hasOrdersNotificationState);
	const gasSpeed = useRecoilValue(gasSpeedState);
	const customGasPrice = useRecoilValue(customGasPriceState);
	const { selectPriceCurrencyRate, selectedPriceCurrency } = useSelectedPriceCurrency();
	// const cmcQuotesQuery = useCMCQuotesQuery([SYNTHS_MAP.sUSD, CRYPTO_CURRENCY_MAP.ETH], {
	// 	enabled: txProvider === '1inch',
	// });
	const slippage = useRecoilValue(slippageState);

	const [selectedBaseChartPeriod, setSelectedBaseChartPeriod] = usePersistedRecoilState<Period>(
		baseChartPeriodState
	);
	const [selectedQuoteChartPeriod, setSelectedQuoteChartPeriod] = usePersistedRecoilState<Period>(
		quoteChartPeriodState
	);
	const [selectedSingleChartPeriod, setSelectedSingleChartPeriod] = usePersistedRecoilState<Period>(
		singleChartPeriodState
	);
	const [selectedBaseChartType, setSelectedBaseChartType] = usePersistedRecoilState<ChartType>(
		baseChartTypeState
	);
	const [selectedQuoteChartType, setSelectedQuoteChartType] = usePersistedRecoilState<ChartType>(
		quoteChartTypeState
	);
	const [selectedSingleChartType, setSelectedSingleChartType] = usePersistedRecoilState<ChartType>(
		singleChartTypeState
	);

	const [isShowingSingleChart, setIsShowingSingleChart] = useState(true);
	const toggleIsShowingSingleChart = () => setIsShowingSingleChart((bool) => !bool);
	const wideWidth = useChartWideWidth();

	const [gasLimit, setGasLimit] = useState<number | null>(null);

	const { base: baseCurrencyKey, quote: quoteCurrencyKey } = currencyPair;
	const ETHBalanceQuery = useETHBalanceQuery();
	const ETHBalance = ETHBalanceQuery.isSuccess ? ETHBalanceQuery.data ?? zeroBN : null;

	const synthsWalletBalancesQuery = useSynthsBalancesQuery();
	const synthsWalletBalance = synthsWalletBalancesQuery.isSuccess
		? synthsWalletBalancesQuery.data
		: null;

	const ethGasPriceQuery = useEthGasPriceQuery();
	const exchangeRatesQuery = useExchangeRatesQuery();
	const feeReclaimPeriodQuery = useFeeReclaimPeriodQuery(quoteCurrencyKey);
	const exchangeFeeRateQuery = useExchangeFeeRate(quoteCurrencyKey, baseCurrencyKey);

	const isBaseCurrencyETH = baseCurrencyKey === CRYPTO_CURRENCY_MAP.ETH;
	const isQuoteCurrencyETH = quoteCurrencyKey === CRYPTO_CURRENCY_MAP.ETH;

	const needsApproval = txProvider === '1inch' && !isQuoteCurrencyETH;

	const quoteCurrencyAmountDebounced = useDebouncedMemo(
		() => quoteCurrencyAmount,
		[quoteCurrencyAmount],
		300
	);

	const tokenListQuery = useZapperTokenList({
		enabled: txProvider === '1inch',
	});
	const tokenList = tokenListQuery.isSuccess ? tokenListQuery.data?.tokens ?? [] : [];

	const tokensWalletBalancesQuery = useTokensBalancesQuery(tokenList);
	const tokenBalances = tokensWalletBalancesQuery.isSuccess
		? tokensWalletBalancesQuery.data ?? null
		: null;

	const tokensMap = tokenListQuery.isSuccess ? tokenListQuery.data?.tokensMap ?? null : null;

	const quoteCurrencyTokenAddress = useMemo(
		() =>
			quoteCurrencyKey != null
				? isQuoteCurrencyETH
					? ETH_ADDRESS
					: get(tokensMap, [quoteCurrencyKey, 'address'], null)
				: null,
		[tokensMap, quoteCurrencyKey, isQuoteCurrencyETH]
	);

	const baseCurrencyTokenAddress = useMemo(
		() =>
			baseCurrencyKey != null
				? isBaseCurrencyETH
					? ETH_ADDRESS
					: get(tokensMap, [baseCurrencyKey, 'address'], null)
				: null,
		[tokensMap, baseCurrencyKey, isBaseCurrencyETH]
	);

	const coinGeckoTokenPricesQuery = useCoinGeckoTokenPricesQuery(
		quoteCurrencyTokenAddress != null && baseCurrencyTokenAddress != null
			? [quoteCurrencyTokenAddress, baseCurrencyTokenAddress]
			: [],
		{
			enabled: txProvider === '1inch',
		}
	);

	const coinGeckoPrices = coinGeckoTokenPricesQuery.isSuccess
		? coinGeckoTokenPricesQuery.data ?? null
		: null;

	const oneInchQuoteQuery = use1InchQuoteQuery(
		quoteCurrencyTokenAddress,
		baseCurrencyTokenAddress,
		quoteCurrencyAmountDebounced,
		get(tokensMap, [quoteCurrencyKey!, 'decimals'], undefined),
		{
			enabled:
				txProvider === '1inch' &&
				quoteCurrencyKey != null &&
				quoteCurrencyAmount != null &&
				quoteCurrencyAmountDebounced !== '' &&
				tokensMap != null,
		}
	);

	const oneInchApproveAddressQuery = use1InchApproveSpenderQuery({
		enabled: txProvider === '1inch',
	});

	const oneInchApproveAddress = oneInchApproveAddressQuery.isSuccess
		? oneInchApproveAddressQuery.data ?? null
		: null;

	const quoteCurrencyContract = useMemo(
		() =>
			needsApproval && tokensMap != null && quoteCurrencyKey != null
				? createERC20Contract(tokensMap[quoteCurrencyKey].address)
				: null,
		[tokensMap, quoteCurrencyKey, createERC20Contract, needsApproval]
	);

	const exchangeFeeRate = exchangeFeeRateQuery.isSuccess ? exchangeFeeRateQuery.data ?? null : null;

	const feeReclaimPeriodInSeconds = feeReclaimPeriodQuery.isSuccess
		? feeReclaimPeriodQuery.data ?? 0
		: 0;

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

	const quoteCurrencyBalance = useMemo(() => {
		if (quoteCurrencyKey != null) {
			if (isQuoteCurrencyETH) {
				return ETHBalance;
			} else if (txProvider === '1inch') {
				return tokenBalances?.[quoteCurrencyKey]?.balance ?? zeroBN;
			} else {
				return synthsWalletBalance != null
					? get(synthsWalletBalance, ['balancesMap', quoteCurrencyKey, 'balance'], zeroBN)
					: null;
			}
		}
		return null;
	}, [
		ETHBalance,
		isQuoteCurrencyETH,
		quoteCurrencyKey,
		synthsWalletBalance,
		txProvider,
		tokenBalances,
	]);

	const baseCurrencyBalance = useMemo(() => {
		if (baseCurrencyKey != null) {
			if (isBaseCurrencyETH) {
				return ETHBalance;
			} else {
				return synthsWalletBalance != null
					? get(synthsWalletBalance, ['balancesMap', baseCurrencyKey, 'balance'], zeroBN)
					: null;
			}
		}
		return null;
	}, [ETHBalance, isBaseCurrencyETH, baseCurrencyKey, synthsWalletBalance]);

	const quotePriceRate = useMemo(
		() =>
			txProvider === '1inch' && !isQuoteCurrencyETH
				? coinGeckoPrices != null &&
				  quoteCurrencyTokenAddress != null &&
				  selectPriceCurrencyRate != null &&
				  coinGeckoPrices[quoteCurrencyTokenAddress.toLowerCase()] != null
					? coinGeckoPrices[quoteCurrencyTokenAddress.toLowerCase()].usd / selectPriceCurrencyRate
					: 0
				: getExchangeRatesForCurrencies(
						exchangeRates,
						quoteCurrencyKey,
						selectedPriceCurrency.name
				  ),
		[
			exchangeRates,
			quoteCurrencyKey,
			selectedPriceCurrency.name,
			txProvider,
			selectPriceCurrencyRate,
			coinGeckoPrices,
			quoteCurrencyTokenAddress,
			isQuoteCurrencyETH,
		]
	);
	const basePriceRate = useMemo(
		() =>
			txProvider === '1inch' && !isBaseCurrencyETH
				? coinGeckoPrices != null &&
				  baseCurrencyTokenAddress != null &&
				  selectPriceCurrencyRate != null &&
				  coinGeckoPrices[baseCurrencyTokenAddress.toLowerCase()] != null
					? coinGeckoPrices[baseCurrencyTokenAddress.toLowerCase()].usd / selectPriceCurrencyRate
					: 0
				: getExchangeRatesForCurrencies(exchangeRates, baseCurrencyKey, selectedPriceCurrency.name),
		[
			exchangeRates,
			baseCurrencyKey,
			selectedPriceCurrency.name,
			txProvider,
			selectPriceCurrencyRate,
			baseCurrencyTokenAddress,
			coinGeckoPrices,
			isBaseCurrencyETH,
		]
	);

	const ethPriceRate = useMemo(
		() => getExchangeRatesForCurrencies(exchangeRates, SYNTHS_MAP.sETH, selectedPriceCurrency.name),
		[exchangeRates, selectedPriceCurrency.name]
	);

	const quoteCurrencyAmountBN = useMemo(
		() => (quoteCurrencyAmount === '' ? zeroBN : toBigNumber(quoteCurrencyAmount)),
		[quoteCurrencyAmount]
	);
	const baseCurrencyAmountBN = useMemo(
		() => (baseCurrencyAmount === '' ? zeroBN : toBigNumber(baseCurrencyAmount)),
		[baseCurrencyAmount]
	);

	const totalTradePrice = useMemo(() => {
		let tradePrice = quoteCurrencyAmountBN.multipliedBy(quotePriceRate);
		if (selectPriceCurrencyRate) {
			tradePrice = tradePrice.dividedBy(selectPriceCurrencyRate);
		}

		return tradePrice;
	}, [quoteCurrencyAmountBN, quotePriceRate, selectPriceCurrencyRate]);

	const estimatedBaseTradePrice = useMemo(() => {
		let tradePrice = baseCurrencyAmountBN.multipliedBy(basePriceRate);
		if (selectPriceCurrencyRate) {
			tradePrice = tradePrice.dividedBy(selectPriceCurrencyRate);
		}

		return tradePrice;
	}, [baseCurrencyAmountBN, basePriceRate, selectPriceCurrencyRate]);

	const selectedBothSides = baseCurrencyKey != null && quoteCurrencyKey != null;

	const quoteCurrencyMarketClosed = useMarketClosed(quoteCurrencyKey);
	const baseCurrencyMarketClosed = useMarketClosed(baseCurrencyKey);

	const submissionDisabledReason = useMemo(() => {
		const insufficientBalance =
			quoteCurrencyBalance != null ? quoteCurrencyAmountBN.gt(quoteCurrencyBalance) : false;

		if (feeReclaimPeriodInSeconds > 0) {
			return t('exchange.summary-info.button.fee-reclaim-period');
		}
		if (!selectedBothSides) {
			return txProvider === '1inch'
				? t('exchange.summary-info.button.select-token')
				: t('exchange.summary-info.button.select-synth');
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
		return null;
	}, [
		quoteCurrencyBalance,
		selectedBothSides,
		isSubmitting,
		feeReclaimPeriodInSeconds,
		baseCurrencyAmountBN,
		quoteCurrencyAmountBN,
		isWalletConnected,
		isApproving,
		t,
		txProvider,
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
			isL2
				? ethGasPriceQuery.data!?.fast
				: customGasPrice !== ''
				? Number(customGasPrice)
				: ethGasPriceQuery.data != null
				? ethGasPriceQuery.data[gasSpeed]
				: null,
		[customGasPrice, ethGasPriceQuery.data, gasSpeed, isL2]
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
		if (txProvider === 'synthetix') {
			getGasLimitEstimate();
		}
		// eslint-disable-next-line
	}, [submissionDisabledReason, gasLimit, txProvider]);

	// reset estimated gas limit when currencies are changed.
	useEffect(() => {
		setGasLimit(null);
	}, [baseCurrencyKey, quoteCurrencyKey]);

	useEffect(() => {
		if (txProvider === '1inch' && quoteCurrencyAmount !== '') {
			if (oneInchQuoteQuery.isSuccess && oneInchQuoteQuery.data != null) {
				setBaseCurrencyAmount(oneInchQuoteQuery.data);
			}
		}
	}, [
		quoteCurrencyAmount,
		baseCurrencyAmount,
		txProvider,
		oneInchQuoteQuery.data,
		oneInchQuoteQuery.isSuccess,
	]);

	const getExchangeParams = useCallback(() => {
		const quoteKeyBytes32 = ethers.utils.formatBytes32String(quoteCurrencyKey!);
		const baseKeyBytes32 = ethers.utils.formatBytes32String(baseCurrencyKey!);
		const amountToExchange = ethers.utils.parseUnits(
			quoteCurrencyAmountBN.decimalPlaces(DEFAULT_TOKEN_DECIMALS).toString(),
			DEFAULT_TOKEN_DECIMALS
		);
		const trackingCode = ethers.utils.formatBytes32String('KWENTA');

		return [quoteKeyBytes32, amountToExchange, baseKeyBytes32, walletAddress, trackingCode];
	}, [baseCurrencyKey, quoteCurrencyAmountBN, quoteCurrencyKey, walletAddress]);

	const getGasLimitEstimateForExchange = useCallback(async () => {
		try {
			if (synthetix.js != null) {
				const exchangeParams = getExchangeParams();
				const gasEstimate = await synthetix.js.contracts.Synthetix.estimateGas.exchangeWithTracking(
					...exchangeParams
				);
				return isL2 ? Number(gasEstimate) : normalizeGasLimit(Number(gasEstimate));
			}
		} catch (e) {
			console.log(e);
		}
		return null;
	}, [getExchangeParams, isL2]);

	const checkAllowance = useCallback(async () => {
		if (
			isWalletConnected &&
			quoteCurrencyKey != null &&
			quoteCurrencyAmount &&
			tokensMap != null &&
			tokensMap![quoteCurrencyKey!] != null &&
			oneInchApproveAddress != null
		) {
			try {
				if (quoteCurrencyContract != null) {
					const allowance = (await quoteCurrencyContract.allowance(
						walletAddress,
						oneInchApproveAddress
					)) as ethers.BigNumber;

					setIsApproved(toBigNumber(ethers.utils.formatEther(allowance)).gte(quoteCurrencyAmount));
				}
			} catch (e) {
				console.log(e);
			}
		}
	}, [
		quoteCurrencyAmount,
		isWalletConnected,
		quoteCurrencyKey,
		walletAddress,
		quoteCurrencyContract,
		tokensMap,
		oneInchApproveAddress,
	]);

	useEffect(() => {
		if (needsApproval) {
			checkAllowance();
		}
	}, [checkAllowance, needsApproval]);

	const handleApprove = async () => {
		if (quoteCurrencyKey != null && gasPrice != null && tokensMap != null) {
			setTxError(null);
			setTxApproveModalOpen(true);

			try {
				const contract = createERC20Contract(tokensMap[quoteCurrencyKey].address);
				if (contract != null) {
					const gasEstimate = await contract.estimateGas.approve(
						oneInchApproveAddress,
						ethers.constants.MaxUint256
					);
					const gasPriceWei = gasPriceInWei(gasPrice);

					const tx = await contract.approve(oneInchApproveAddress, ethers.constants.MaxUint256, {
						gasLimit: isL2 ? Number(gasEstimate) : normalizeGasLimit(Number(gasEstimate)),
						gasPrice: gasPriceWei,
					});

					if (tx != null) {
						monitorTransaction({
							txHash: tx.hash,
							onTxConfirmed: () => {
								setIsApproving(false);
								setIsApproved(true);
							},
						});
					}
				}

				setTxApproveModalOpen(false);
			} catch (e) {
				console.log(e);
				setIsApproving(false);
				setTxError(e.message);
			}
		}
	};

	const handleSubmit = useCallback(async () => {
		if (synthetix.js != null && gasPrice != null) {
			setTxError(null);
			setTxConfirmationModalOpen(true);
			const exchangeParams = getExchangeParams();

			try {
				setIsSubmitting(true);

				let tx: ethers.ContractTransaction | null = null;

				const gasPriceWei = gasPriceInWei(gasPrice);

				if (txProvider === '1inch' && tokensMap != null) {
					tx = await swap1Inch(
						quoteCurrencyTokenAddress!,
						baseCurrencyTokenAddress!,
						quoteCurrencyAmount,
						slippage,
						tokensMap[quoteCurrencyKey!].decimals
					);
				} else {
					const gasLimitEstimate = await getGasLimitEstimateForExchange();

					setGasLimit(gasLimitEstimate);

					const gas = {
						gasPrice: gasPriceWei,
						gasLimit: gasLimitEstimate,
					};
					tx = await synthetix.js.contracts.Synthetix.exchangeWithTracking(...exchangeParams, gas);
				}

				if (tx != null) {
					setOrders((orders) =>
						produce(orders, (draftState) => {
							draftState.push({
								timestamp: Date.now(),
								hash: tx!.hash,
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

					monitorTransaction({
						txHash: tx.hash,
						onTxConfirmed: () => {
							setOrders((orders) =>
								produce(orders, (draftState) => {
									const orderIndex = orders.findIndex((order) => order.hash === tx!.hash);
									if (draftState[orderIndex]) {
										draftState[orderIndex].status = 'confirmed';
									}
								})
							);
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
	}, [
		baseCurrencyAmount,
		baseCurrencyKey,
		baseCurrencyTokenAddress,
		gasPrice,
		getExchangeParams,
		getGasLimitEstimateForExchange,
		quoteCurrencyAmount,
		quoteCurrencyKey,
		quoteCurrencyTokenAddress,
		setHasOrdersNotification,
		setOrders,
		swap1Inch,
		synthsWalletBalancesQuery,
		txProvider,
		monitorTransaction,
		slippage,
		tokensMap,
	]);

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
			onAmountChange={async (value) => {
				if (value === '') {
					resetCurrencies();
				} else {
					setQuoteCurrencyAmount(value);
					if (txProvider === 'synthetix') {
						const baseCurrencyAmountNoFee = toBigNumber(value).multipliedBy(rate);
						const fee = baseCurrencyAmountNoFee.multipliedBy(exchangeFeeRate ?? 1);
						setBaseCurrencyAmount(
							baseCurrencyAmountNoFee.minus(fee).decimalPlaces(DEFAULT_TOKEN_DECIMALS).toString()
						);
					}
				}
			}}
			walletBalance={quoteCurrencyBalance}
			onBalanceClick={async () => {
				if (quoteCurrencyBalance != null) {
					if (quoteCurrencyKey === 'ETH') {
						const ETH_TX_BUFFER = 0.1;
						const balanceWithBuffer = quoteCurrencyBalance.minus(toBigNumber(ETH_TX_BUFFER));
						setQuoteCurrencyAmount(
							balanceWithBuffer.isNegative() ? '0' : balanceWithBuffer.toString()
						);
					} else {
						setQuoteCurrencyAmount(quoteCurrencyBalance.toString());
					}
					if (txProvider === 'synthetix') {
						const baseCurrencyAmountNoFee = toBigNumber(quoteCurrencyBalance).multipliedBy(rate);
						const fee = baseCurrencyAmountNoFee.multipliedBy(exchangeFeeRate ?? 1);
						setBaseCurrencyAmount(
							baseCurrencyAmountNoFee.minus(fee).decimalPlaces(DEFAULT_TOKEN_DECIMALS).toString()
						);
					}
				}
			}}
			onCurrencySelect={
				allowQuoteCurrencySelection
					? () =>
							txProvider === '1inch'
								? setSelectQuoteTokenModalOpen(true)
								: setSelectQuoteCurrencyModalOpen(true)
					: undefined
			}
			priceRate={quotePriceRate}
			label={t('exchange.common.from')}
			txProvider={txProvider}
		/>
	);
	const quotePriceChartCard = showPriceCard ? (
		<PriceChartCard
			side="quote"
			currencyKey={quoteCurrencyKey}
			openAfterHoursModalCallback={() => setSelectBalancerTradeModal(true)}
			priceRate={quotePriceRate}
			selectedChartType={selectedQuoteChartType}
			setSelectedChartType={setSelectedQuoteChartType}
			selectedChartPeriod={selectedQuoteChartPeriod}
			setSelectedChartPeriod={setSelectedQuoteChartPeriod}
		/>
	) : null;

	const quoteMarketDetailsCard = showMarketDetailsCard ? (
		<MarketDetailsCard currencyKey={quoteCurrencyKey} priceRate={quotePriceRate} />
	) : null;

	const slippagePercent = useMemo(() => {
		if (txProvider === '1inch') {
			if (!totalTradePrice.isNaN() && !estimatedBaseTradePrice.isNaN()) {
				return totalTradePrice.minus(estimatedBaseTradePrice).dividedBy(totalTradePrice).negated();
			}
		}
		return null;
		// eslint-disable-next-line
	}, [estimatedBaseTradePrice, txProvider]);

	const baseCurrencyCard = (
		<CurrencyCard
			side="base"
			currencyKey={baseCurrencyKey}
			amount={baseCurrencyAmount}
			onAmountChange={async (value) => {
				if (value === '') {
					resetCurrencies();
				} else {
					setBaseCurrencyAmount(value);
					if (txProvider === 'synthetix') {
						const quoteCurrencyAmountNoFee = toBigNumber(value).multipliedBy(inverseRate);
						const fee = quoteCurrencyAmountNoFee.multipliedBy(exchangeFeeRate ?? 1);
						setQuoteCurrencyAmount(
							quoteCurrencyAmountNoFee.plus(fee).decimalPlaces(DEFAULT_TOKEN_DECIMALS).toString()
						);
					}
				}
			}}
			walletBalance={baseCurrencyBalance}
			onBalanceClick={async () => {
				if (baseCurrencyBalance != null) {
					setBaseCurrencyAmount(baseCurrencyBalance.toString());

					if (txProvider === 'synthetix') {
						const baseCurrencyAmountNoFee = toBigNumber(baseCurrencyBalance).multipliedBy(
							inverseRate
						);
						const fee = baseCurrencyAmountNoFee.multipliedBy(exchangeFeeRate ?? 1);
						setQuoteCurrencyAmount(
							baseCurrencyAmountNoFee.plus(fee).decimalPlaces(DEFAULT_TOKEN_DECIMALS).toString()
						);
					}
				}
			}}
			onCurrencySelect={
				allowBaseCurrencySelection
					? () =>
							txProvider === '1inch'
								? setSelectBaseTokenModalOpen(true)
								: setSelectBaseCurrencyModalOpen(true)
					: undefined
			}
			priceRate={basePriceRate}
			label={t('exchange.common.into')}
			disableInput={txProvider === '1inch'}
			slippagePercent={slippagePercent}
			isLoading={txProvider === '1inch' && oneInchQuoteQuery.isFetching}
			txProvider={txProvider}
		/>
	);

	const basePriceChartCard = showPriceCard ? (
		<PriceChartCard
			side="base"
			currencyKey={baseCurrencyKey}
			priceRate={basePriceRate}
			openAfterHoursModalCallback={() => setSelectBalancerTradeModal(true)}
			alignRight
			selectedChartType={selectedBaseChartType}
			setSelectedChartType={setSelectedBaseChartType}
			selectedChartPeriod={selectedBaseChartPeriod}
			setSelectedChartPeriod={setSelectedBaseChartPeriod}
		/>
	) : null;

	const baseMarketDetailsCard = showMarketDetailsCard ? (
		<MarketDetailsCard currencyKey={baseCurrencyKey} priceRate={basePriceRate} />
	) : null;

	const combinedPriceChartCard = showPriceCard ? (
		<CombinedPriceChartCard
			{...{
				baseCurrencyKey,
				basePriceRate,
				quoteCurrencyKey,
				quotePriceRate,
			}}
			selectedChartType={selectedSingleChartType}
			setSelectedChartType={setSelectedSingleChartType}
			openAfterHoursModalCallback={() => setSelectBalancerTradeModal(true)}
			selectedChartPeriod={selectedSingleChartPeriod}
			setSelectedChartPeriod={setSelectedSingleChartPeriod}
		/>
	) : null;

	const combinedMarketDetailsCard = showMarketDetailsCard ? (
		<CombinedMarketDetailsCard
			{...{ baseCurrencyKey, basePriceRate, quoteCurrencyKey, quotePriceRate }}
		/>
	) : null;

	const footerCard = (
		<>
			{!isWalletConnected ? (
				<ConnectWalletCard attached={footerCardAttached} />
			) : hasNoL2Gas ? (
				<GetL2GasCard attached={footerCardAttached} />
			) : (baseCurrencyMarketClosed.isMarketClosed &&
					baseCurrencyKey &&
					AFTER_HOURS_SYNTHS.has(baseCurrencyKey)) ||
			  (quoteCurrencyMarketClosed.isMarketClosed &&
					quoteCurrencyKey &&
					AFTER_HOURS_SYNTHS.has(quoteCurrencyKey)) ? (
				<TradeBalancerFooterCard
					attached={footerCardAttached}
					onClick={() => setSelectBalancerTradeModal(true)}
				/>
			) : baseCurrencyMarketClosed.isMarketClosed || quoteCurrencyMarketClosed.isMarketClosed ? (
				<MarketClosureCard
					baseCurrencyMarketClosed={baseCurrencyMarketClosed}
					quoteCurrencyMarketClosed={quoteCurrencyMarketClosed}
					attached={footerCardAttached}
					quoteCurrencyKey={quoteCurrencyKey}
					baseCurrencyKey={baseCurrencyKey}
				/>
			) : showNoSynthsCard && noSynths ? (
				<NoSynthsCard attached={footerCardAttached} />
			) : (
				<TradeSummaryCard
					attached={footerCardAttached}
					submissionDisabledReason={submissionDisabledReason}
					onSubmit={needsApproval ? (isApproved ? handleSubmit : handleApprove) : handleSubmit}
					totalTradePrice={baseCurrencyAmount ? totalTradePrice.toString() : null}
					baseCurrencyAmount={baseCurrencyAmount}
					basePriceRate={basePriceRate}
					baseCurrency={baseCurrency}
					gasPrices={ethGasPriceQuery.data}
					feeReclaimPeriodInSeconds={feeReclaimPeriodInSeconds}
					quoteCurrencyKey={quoteCurrencyKey}
					feeRate={exchangeFeeRate}
					transactionFee={transactionFee}
					feeCost={feeCost}
					// show fee's only for "synthetix" (provider)
					showFee={txProvider === 'synthetix' ? true : false}
					isApproved={needsApproval ? isApproved : undefined}
					show1InchProvider={txProvider === '1inch'}
				/>
			)}
			{txConfirmationModalOpen && (
				<TxConfirmationModal
					onDismiss={() => setTxConfirmationModalOpen(false)}
					txError={txError}
					attemptRetry={handleSubmit}
					baseCurrencyAmount={baseCurrencyAmount}
					quoteCurrencyAmount={quoteCurrencyAmount}
					feeCost={txProvider === 'synthetix' ? feeCost : null}
					baseCurrencyKey={baseCurrencyKey!}
					quoteCurrencyKey={quoteCurrencyKey!}
					totalTradePrice={estimatedBaseTradePrice.toString()}
					txProvider={txProvider}
					quoteCurrencyLabel={t('exchange.common.from')}
					baseCurrencyLabel={t('exchange.common.into')}
					icon={<Svg src={ArrowsIcon} />}
				/>
			)}
			{selectBaseCurrencyModalOpen && (
				<SelectCurrencyModal
					onDismiss={() => setSelectBaseCurrencyModalOpen(false)}
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
				<SelectCurrencyModal
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
			{selectQuoteTokenModalOpen && (
				<SelectTokenModal
					onDismiss={() => setSelectQuoteTokenModalOpen(false)}
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
					tokensToOmit={SYNTHS}
				/>
			)}
			{selectBaseTokenModalOpen && (
				<SelectCurrencyModal
					onDismiss={() => setSelectBaseTokenModalOpen(false)}
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
					synthsOverride={[SYNTHS_MAP.sETH, SYNTHS_MAP.sUSD]}
				/>
			)}
			{txApproveModalOpen && (
				<TxApproveModal
					onDismiss={() => setTxApproveModalOpen(false)}
					txError={txError}
					attemptRetry={handleApprove}
					currencyKey={quoteCurrencyKey!}
					currencyLabel={<NoTextTransform>{quoteCurrencyKey}</NoTextTransform>}
					txProvider={txProvider}
				/>
			)}
			{selectBalancerTradeModal && (
				<BalancerTradeModal onDismiss={() => setSelectBalancerTradeModal(false)} />
			)}
		</>
	);

	const l2TradingIncentiveCard = <L2TradingIncentiveCard attached={footerCardAttached} />;

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
		combinedPriceChartCard,
		combinedMarketDetailsCard,
		footerCard,
		handleCurrencySwap,
		toggleIsShowingSingleChart,
		isShowingSingleChart,
		wideWidth,
		l2TradingIncentiveCard,
	};
};

export default useExchange;
