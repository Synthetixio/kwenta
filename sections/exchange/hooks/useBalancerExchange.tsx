import { useState, useEffect, useMemo, useCallback } from 'react';
import { ethers } from 'ethers';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import get from 'lodash/get';
import produce from 'immer';
import { SOR } from '@balancer-labs/sor';
import { BigNumber } from 'bignumber.js';
import { NetworkId } from '@synthetixio/js';

import { CRYPTO_CURRENCY_MAP, CurrencyKey } from 'constants/currency';

import Connector from 'containers/Connector';
import Etherscan from 'containers/Etherscan';

import useSynthsBalancesQuery from 'queries/walletBalances/useSynthsBalancesQuery';
import useETHBalanceQuery from 'queries/walletBalances/useETHBalanceQuery';
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
import BalancerApproveModal from 'sections/shared/modals/BalancerApproveModal';

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
import { gasPriceInWei, normalizeGasLimit } from 'utils/network';
import useSelectedPriceCurrency from 'hooks/useSelectedPriceCurrency';
import useMarketClosed from 'hooks/useMarketClosed';
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

const TX_PROVIDER = 'balancer';

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
	const [smartOrderRouter, setSmartOrderRouter] = useState<SOR | null>(null);
	const [balancerProxyContract, setBalancerProxyContract] = useState<ethers.Contract | null>(null);
	const [approveError, setApproveError] = useState<string | null>(null);
	const [isApproving, setIsApproving] = useState<boolean>(false);
	const [baseAllowance, setBaseAllowance] = useState<string | null>(null);
	const [approveModalOpen, setApproveModalOpen] = useState<boolean>(false);

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

		if (baseAllowance == null || quoteCurrencyAmountBN.lte(baseAllowance)) {
			return 'approve';
		}
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
		if (isApproving) {
			return 'submitting-approval';
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
			synthetix?.js != null &&
			provider != null &&
			gasPrice != null &&
			network?.id != null &&
			(network.id == NetworkId.Mainnet || network.id == NetworkId.Kovan)
		) {
			const maxNoPools = 1;
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

	const getAllowanceAndInitProxyContract = useCallback(
		async ({
			address,
			key,
			id,
			contractNeedsInit,
		}: {
			address: string | null;
			key: CurrencyKey | null;
			id: NetworkId | null;
			contractNeedsInit: boolean;
		}) => {
			if (
				address != null &&
				key != null &&
				synthetix?.js != null &&
				provider != null &&
				id != null &&
				(id == NetworkId.Mainnet || id == NetworkId.Kovan)
			) {
				if (contractNeedsInit) {
					const proxyContract = new ethers.Contract(
						BALANCER_LINKS[id].proxyAddr,
						balancerExchangeProxyABI,
						provider
					);
					setBalancerProxyContract(proxyContract);
				}
				const allowance = await synthetix.js.contracts[`Synth${key}`].allowance(
					address,
					BALANCER_LINKS[id].proxyAddr
				);
				setBaseAllowance(new BigNumber(allowance).toString());
			}
		},
		[]
	);

	useEffect(() => {
		getAllowanceAndInitProxyContract({
			address: walletAddress,
			key: baseCurrencyKey,
			id: network?.id ?? null,
			contractNeedsInit: true,
		});
	}, [walletAddress, baseCurrencyKey, network?.id]);

	useEffect(() => {
		if (synthetix?.js && baseCurrencyKey != null && baseCurrencyKey != null) {
			setBaseCurrencyAddress(synthetix.js.contracts[`Synth${baseCurrencyKey}`].address);
			setQuoteCurrencyAddress(synthetix.js.contracts[`Synth${quoteCurrencyKey}`].address);
		}
	}, [baseCurrencyKey, quoteCurrencyKey]);

	const calculateExchangeRate = useCallback(
		async ({ value, isBase }: { value: BigNumber; isBase: boolean }) => {
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
		},
		[smartOrderRouter, quoteCurrencyAddress, baseCurrencyAddress, hasSetCostOutputTokenCalled]
	);

	const handleApprove = useCallback(async () => {
		if (gasPrice != null && balancerProxyContract != null) {
			try {
				const { contracts } = synthetix.js!;
				setIsApproving(true);
				setApproveError(null);
				setApproveModalOpen(true);
				const gasLimitEstimate = await contracts[`Synth${baseCurrencyKey}`].estimateGas.approve(
					balancerProxyContract.address,
					ethers.constants.MaxUint256
				);
				const allowanceTx: ethers.ContractTransaction = await contracts[
					`Synth${baseCurrencyKey}`
				].approve(balancerProxyContract.address, ethers.constants.MaxUint256, {
					// TODO sort out gas price for approval
					gasPrice: gasPriceInWei(gasPrice),
					gasLimit: normalizeGasLimit(gasLimitEstimate.toNumber()),
				});
				if (allowanceTx) {
					setOrders((orders) =>
						produce(orders, (draftState) => {
							draftState.push({
								timestamp: Date.now(),
								hash: allowanceTx.hash,
								baseCurrencyKey: baseCurrencyKey!,
								baseCurrencyAmount,
								quoteCurrencyKey: quoteCurrencyKey!,
								quoteCurrencyAmount,
								orderType: 'market',
								status: 'pending',
								transaction: allowanceTx,
							});
						})
					);
					setHasOrdersNotification(true);

					if (notify) {
						const { emitter } = notify.hash(allowanceTx.hash);
						const link =
							etherscanInstance != null ? etherscanInstance.txLink(allowanceTx.hash) : undefined;

						emitter.on('txConfirmed', () => {
							setOrders((orders) =>
								produce(orders, (draftState) => {
									const orderIndex = orders.findIndex((order) => order.hash === allowanceTx.hash);
									if (draftState[orderIndex]) {
										draftState[orderIndex].status = 'confirmed';
									}
								})
							);
							getAllowanceAndInitProxyContract({
								address: walletAddress,
								key: baseCurrencyKey,
								id: network?.id ?? null,
								contractNeedsInit: false,
							});
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
				setApproveError(e.message);
				setIsApproving(false);
			}
		}
	}, [
		gasPrice,
		balancerProxyContract,
		etherscanInstance,
		walletAddress,
		baseCurrencyKey,
		network?.id,
	]);

	const handleSubmit = useCallback(async () => {
		if (
			synthetix.js != null &&
			gasPrice != null &&
			balancerProxyContract?.address != null &&
			provider != null
		) {
			setTxError(false);
			setTxConfirmationModalOpen(true);

			try {
				setIsSubmitting(true);

				const gasPriceWei = gasPriceInWei(gasPrice);

				const tx = await balancerProxyContract.multihopBatchSwapExactIn(
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
	}, [
		gasPrice,
		balancerProxyContract,
		swaps,
		baseCurrencyAddress,
		quoteCurrencyAddress,
		baseCurrencyAmountBN.toString(),
		quoteCurrencyAmountBN.toString(),
	]);

	const handleAmountChange = useCallback(
		({
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
		},
		[(baseCurrencyBalance ?? 0).toString(), (quoteCurrencyBalance ?? 0).toString()]
	);

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
					onSubmit={submissionDisabledReason === 'approve' ? handleApprove : handleSubmit}
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
					txProvider={TX_PROVIDER}
				/>
			)}
			{approveModalOpen && (
				<BalancerApproveModal
					onDismiss={() => setApproveModalOpen(false)}
					synth={baseCurrencyKey!}
					approveError={approveError}
				/>
			)}
		</>
	);

	return {
		quoteCurrencyCard,
		baseCurrencyCard,
		footerCard,
		handleCurrencySwap,
	};
};

export default useBalancerExchange;
