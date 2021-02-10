import { useState, useEffect, useMemo } from 'react';
import { ethers } from 'ethers';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import get from 'lodash/get';
import produce from 'immer';
import { SOR } from '@balancer-labs/sor';
import { BigNumber } from 'bignumber.js';
import { NetworkId } from '@synthetixio/js';

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
import TradeSummaryCard, {
	SubmissionDisabledReason,
} from 'sections/exchange/FooterCard/TradeSummaryCard';
import NoSynthsCard from 'sections/exchange/FooterCard/NoSynthsCard';
import MarketClosureCard from 'sections/exchange/FooterCard/MarketClosureCard';
import ConnectWalletCard from 'sections/exchange/FooterCard/ConnectWalletCard';
import TxConfirmationModal from 'sections/shared/modals/TxConfirmationModal';

import { hasOrdersNotificationState } from 'store/ui';
import {
	customGasPriceState,
	gasSpeedState,
	isWalletConnectedState,
	walletAddressState,
	networkState,
} from 'store/wallet';
import { ordersState } from 'store/orders';

import { getExchangeRatesForCurrencies } from 'utils/currencies';

import synthetix from 'lib/synthetix';

import useFeeReclaimPeriodQuery from 'queries/synths/useFeeReclaimPeriodQuery';
import { getTransactionPrice, gasPriceInWei } from 'utils/network';
import useSelectedPriceCurrency from 'hooks/useSelectedPriceCurrency';
import useMarketClosed from 'hooks/useMarketClosed';
import OneInch from 'containers/OneInch';
import useCurrencyPair from './useCurrencyPair';
import { toBigNumber, zeroBN } from 'utils/formatters/number';

import balancerExchangeProxyABI from './balancerExchangeProxyABI';

type ExchangeCardProps = {
	defaultBaseCurrencyKey?: CurrencyKey | null;
	defaultQuoteCurrencyKey?: CurrencyKey | null;
	showPriceCard?: boolean;
	showMarketDetailsCard?: boolean;
	footerCardAttached?: boolean;
	persistSelectedCurrencies?: boolean;
	allowCurrencySelection?: boolean;
	showNoSynthsCard?: boolean;
};

const BALANCER_LINKS = {
	[NetworkId.Mainnet]: {
		poolsUrl:
			'https://ipfs.fleek.co/ipns/balancer-team-bucket.storage.fleek.co/balancer-exchange/pools',
		proxyAddr: '0x3E66B66Fd1d0b02fDa6C811Da9E0547970DB2f21', // Balancer Mainnet proxy
	},
	[NetworkId.Kovan]: {
		poolsUrl:
			'https://ipfs.fleek.co/ipns/balancer-team-bucket.storage.fleek.co/balancer-exchange-kovan/pools',
		proxyAddr: '0x4e67bf5bD28Dd4b570FBAFe11D0633eCbA2754Ec', // Kovan proxy
	},
};

const useBalancerExchange = ({
	defaultBaseCurrencyKey = null,
	defaultQuoteCurrencyKey = null,
	showPriceCard = false,
	showMarketDetailsCard = false,
	footerCardAttached = false,
	persistSelectedCurrencies = false,
	showNoSynthsCard = true,
}: ExchangeCardProps) => {
	const { notify, provider } = Connector.useContainer();
	const { etherscanInstance } = Etherscan.useContainer();
	const network = useRecoilValue(networkState);

	const [currencyPair, setCurrencyPair] = useCurrencyPair({
		persistSelectedCurrencies,
		defaultBaseCurrencyKey,
		defaultQuoteCurrencyKey,
	});
	const [hasSetCostOutputTokenCalled, setHasSetCostOutputTokenCalled] = useState<boolean>(false);
	const [baseCurrencyAmount, setBaseCurrencyAmount] = useState<string>('');
	const [quoteCurrencyAmount, setQuoteCurrencyAmount] = useState<string>('');
	const [baseCurrencyAddress, setBaseCurrencyAddress] = useState<string | null>(null);
	const [quoteCurrencyAddress, setQuoteCurrencyAddress] = useState<string | null>(null);
	const [balancerProxyAddress, setBalancerProxyAddress] = useState<string | null>(null);
	const [smartOrderRouter, setSmartOrderRouter] = useState<SOR | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [isApproving, setIsApproving] = useState<boolean>(false);
	const [txModalOpen, setTxModalOpen] = useState<boolean>(false);

	// TODO type swaps
	const [swaps, setSwaps] = useState<Array<any> | null>(null);
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
	const isWalletConnected = useRecoilValue(isWalletConnectedState);

	const walletAddress = useRecoilValue(walletAddressState);
	const [txConfirmationModalOpen, setTxConfirmationModalOpen] = useState<boolean>(false);
	const [txError, setTxError] = useState<boolean>(false);
	const setOrders = useSetRecoilState(ordersState);
	const setHasOrdersNotification = useSetRecoilState(hasOrdersNotificationState);
	const gasSpeed = useRecoilValue(gasSpeedState);
	const customGasPrice = useRecoilValue(customGasPriceState);
	const { selectPriceCurrencyRate, selectedPriceCurrency } = useSelectedPriceCurrency();
	const exchangeFeeRate = 0.003;

	const { base: baseCurrencyKey, quote: quoteCurrencyKey } = currencyPair;

	const isQuoteCurrencyETH = quoteCurrencyKey === CRYPTO_CURRENCY_MAP.ETH;
	const ETHBalanceQuery = useETHBalanceQuery();
	const synthsWalletBalancesQuery = useSynthsBalancesQuery();
	const ethGasPriceQuery = useEthGasPriceQuery();
	const exchangeRatesQuery = useExchangeRatesQuery();
	const feeReclaimPeriodQuery = useFeeReclaimPeriodQuery(quoteCurrencyKey);

	const feeReclaimPeriodInSeconds = feeReclaimPeriodQuery.isSuccess
		? feeReclaimPeriodQuery.data ?? 0
		: 0;

	const baseCurrency =
		baseCurrencyKey != null && synthetix.synthsMap != null
			? synthetix.synthsMap[baseCurrencyKey]
			: null;

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

	const handleCurrencySwap = () => {
		const baseAmount = baseCurrencyAmount;
		const quoteAmount = quoteCurrencyAmount;

		setCurrencyPair({
			base: quoteCurrencyKey,
			quote: baseCurrencyKey,
		});

		setBaseCurrencyAmount(quoteAmount);
		setQuoteCurrencyAmount(baseAmount);
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

	useEffect(() => {
		if (
			provider != null &&
			gasPrice != null &&
			network?.id != null &&
			(network.id == NetworkId.Mainnet || network.id == NetworkId.Kovan)
		) {
			let maxNoPools = 1;
			setBalancerProxyAddress(BALANCER_LINKS[network.id].proxyAddr);
			const sor = new SOR(
				provider as ethers.providers.BaseProvider,
				new BigNumber(gasPrice),
				maxNoPools,
				network?.id,
				BALANCER_LINKS[network.id].poolsUrl
			);
			setSmartOrderRouter(sor);
		}
	}, [provider, gasPrice, network?.id]);

	useEffect(() => {
		if (synthetix?.js && baseCurrencyKey != null && baseCurrencyKey != null) {
			setBaseCurrencyAddress(synthetix.js.contracts[`Synth${baseCurrencyKey}`].address);
			setQuoteCurrencyAddress(synthetix.js.contracts[`Synth${quoteCurrencyKey}`].address);
		}
	}, [baseCurrencyKey, quoteCurrencyKey]);

	const calculateExchangeRate = async ({
		value,
		isBase,
	}: {
		value: BigNumber;
		isBase: boolean;
	}) => {
		if (smartOrderRouter != null && quoteCurrencyAddress != null && baseCurrencyAddress != null) {
			let swapType = isBase ? 'swapExactIn' : 'swapExactOut';
			await smartOrderRouter.fetchPools();

			if (!hasSetCostOutputTokenCalled) {
				await smartOrderRouter.setCostOutputToken(quoteCurrencyAddress);
				setHasSetCostOutputTokenCalled(true);
			}

			const [tradeSwaps, resultingAmount] = await smartOrderRouter.getSwaps(
				baseCurrencyAddress,
				quoteCurrencyAddress,
				swapType,
				value
			);

			setSwaps(tradeSwaps);
			isBase
				? setBaseCurrencyAmount(resultingAmount.toString())
				: setQuoteCurrencyAmount(resultingAmount.toString());
		}
	};

	const handleApprove = async () => {
		try {
			const {
				contracts,
				utils: { parseEther },
			} = synthetix.js!;
			setIsApproving(true);
			setError(null);
			setTxModalOpen(true);
			const allowanceTx: ethers.ContractTransaction = await contracts[
				`Synth${baseCurrencyKey}`
			].approve(balancerProxyAddress, ethers.constants.MaxUint256, {
				// TODO sort out gas price for approval
				gasPrice: normalizedGasPrice(gasPrice),
				gasLimit: gasLimitEstimate,
			});
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
		} catch (e) {
			console.log(e);
			setError(e.message);
			setIsApproving(false);
		}
	};

	const handleSubmit = async () => {
		if (
			synthetix.js != null &&
			gasPrice != null &&
			balancerProxyAddress != null &&
			provider != null
		) {
			setTxError(false);
			setTxConfirmationModalOpen(true);

			let proxyContract = new ethers.Contract(
				balancerProxyAddress,
				balancerExchangeProxyABI,
				provider
			);
			try {
				setIsSubmitting(true);

				const gasPriceWei = gasPriceInWei(gasPrice);

				const tx = await proxyContract.multihopBatchSwapExactIn(
					swaps,
					baseCurrencyAddress,
					quoteCurrencyAddress,
					baseCurrencyAmountBN.toString(),
					quoteCurrencyAmountBN.toString(),
					{
						gasPrice: gasPriceWei.toString(),
					}
				);

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

	const handleAmountChange = ({
		value,
		isBase,
		isMaxClick = false,
	}: {
		value: string;
		isBase: boolean;
		isMaxClick?: boolean;
	}) => {
		if (value === '' && !isMaxClick) {
			setBaseCurrencyAmount('');
			setQuoteCurrencyAmount('');
		} else if (isBase) {
			const baseAmount = isMaxClick ? (baseCurrencyBalance ?? 0).toString() : value;
			setBaseCurrencyAmount(baseAmount);
			calculateExchangeRate({ value: new BigNumber(baseAmount), isBase: true });
		} else {
			const quoteAmount = isMaxClick ? (quoteCurrencyBalance ?? 0).toString() : value;
			setQuoteCurrencyAmount(quoteAmount);
			calculateExchangeRate({ value: new BigNumber(quoteAmount), isBase: true });
		}
	};

	const quoteCurrencyCard = (
		<CurrencyCard
			side="quote"
			currencyKey={quoteCurrencyKey}
			amount={quoteCurrencyAmount}
			onAmountChange={(value) => handleAmountChange({ value, isBase: false })}
			walletBalance={quoteCurrencyBalance}
			onBalanceClick={() => handleAmountChange({ value: '', isBase: false, isMaxClick: true })}
			onCurrencySelect={undefined}
			priceRate={quotePriceRate}
		/>
	);
	const quotePriceChartCard = showPriceCard ? (
		<PriceChartCard side="quote" currencyKey={quoteCurrencyKey} priceRate={quotePriceRate} />
	) : null;

	const quoteMarketDetailsCard = showMarketDetailsCard ? (
		<MarketDetailsCard currencyKey={quoteCurrencyKey} priceRate={quotePriceRate} />
	) : null;

	const baseCurrencyCard = (
		<CurrencyCard
			side="base"
			currencyKey={baseCurrencyKey}
			amount={baseCurrencyAmount}
			onAmountChange={(value) => handleAmountChange({ value, isBase: true })}
			walletBalance={baseCurrencyBalance}
			onBalanceClick={() => handleAmountChange({ value: '', isBase: true, isMaxClick: true })}
			onCurrencySelect={undefined}
			priceRate={basePriceRate}
		/>
	);

	const basePriceChartCard = showPriceCard ? (
		<PriceChartCard side="base" currencyKey={baseCurrencyKey} priceRate={basePriceRate} />
	) : null;

	const baseMarketDetailsCard = showMarketDetailsCard ? (
		<MarketDetailsCard currencyKey={baseCurrencyKey} priceRate={basePriceRate} />
	) : null;

	// TODO: support more providers
	const txProvider = 'balancer';

	const footerCard = (
		<>
			{!isWalletConnected ? (
				<ConnectWalletCard attached={footerCardAttached} />
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
					transactionFee={null}
					feeCost={feeCost}
					// show fee's only for "synthetix" (provider)
					showFee={false}
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
			{/* TODO add approval modal */}
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

export default useBalancerExchange;
