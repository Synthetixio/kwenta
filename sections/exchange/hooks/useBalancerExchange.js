"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _a;
exports.__esModule = true;
var react_1 = require("react");
var styled_components_1 = require("styled-components");
var ethers_1 = require("ethers");
var recoil_1 = require("recoil");
var get_1 = require("lodash/get");
var immer_1 = require("immer");
var sor_1 = require("@balancer-labs/sor");
var bignumber_js_1 = require("bignumber.js");
var js_1 = require("@synthetixio/js");
var currency_1 = require("constants/currency");
var Connector_1 = require("containers/Connector");
var Etherscan_1 = require("containers/Etherscan");
var useSynthsBalancesQuery_1 = require("queries/walletBalances/useSynthsBalancesQuery");
var useEthGasPriceQuery_1 = require("queries/network/useEthGasPriceQuery");
var CurrencyCard_1 = require("sections/exchange/TradeCard/CurrencyCard");
var TradeBalancerSummaryCard_1 = require("sections/exchange/FooterCard/TradeBalancerSummaryCard");
var NoSynthsCard_1 = require("sections/exchange/FooterCard/NoSynthsCard");
var ConnectWalletCard_1 = require("sections/exchange/FooterCard/ConnectWalletCard");
var TxConfirmationModal_1 = require("sections/shared/modals/TxConfirmationModal");
var BalancerApproveModal_1 = require("sections/shared/modals/BalancerApproveModal");
var ui_1 = require("store/ui");
var wallet_1 = require("store/wallet");
var orders_1 = require("store/orders");
var useSelectedPriceCurrency_1 = require("hooks/useSelectedPriceCurrency");
var synthetix_1 = require("lib/synthetix");
var useFeeReclaimPeriodQuery_1 = require("queries/synths/useFeeReclaimPeriodQuery");
var network_1 = require("utils/network");
var useCurrencyPair_1 = require("./useCurrencyPair");
var number_1 = require("utils/formatters/number");
var balancerExchangeProxyABI_1 = require("./balancerExchangeProxyABI");
var TX_PROVIDER = 'balancer';
var BALANCER_LINKS = (_a = {},
    _a[js_1.NetworkId.Mainnet] = {
        poolsUrl: 'https://ipfs.fleek.co/ipns/balancer-team-bucket.storage.fleek.co/balancer-exchange/pools',
        proxyAddr: '0x3E66B66Fd1d0b02fDa6C811Da9E0547970DB2f21'
    },
    _a[js_1.NetworkId.Kovan] = {
        poolsUrl: 'https://ipfs.fleek.co/ipns/balancer-team-bucket.storage.fleek.co/balancer-exchange-kovan/pools',
        proxyAddr: '0x4e67bf5bD28Dd4b570FBAFe11D0633eCbA2754Ec'
    },
    _a);
var useBalancerExchange = function (_a) {
    var _b;
    var _c = _a.defaultBaseCurrencyKey, defaultBaseCurrencyKey = _c === void 0 ? null : _c, _d = _a.defaultQuoteCurrencyKey, defaultQuoteCurrencyKey = _d === void 0 ? null : _d, _e = _a.footerCardAttached, footerCardAttached = _e === void 0 ? false : _e, _f = _a.persistSelectedCurrencies, persistSelectedCurrencies = _f === void 0 ? false : _f, _g = _a.showNoSynthsCard, showNoSynthsCard = _g === void 0 ? true : _g;
    var _h = Connector_1["default"].useContainer(), notify = _h.notify, provider = _h.provider;
    var etherscanInstance = Etherscan_1["default"].useContainer().etherscanInstance;
    var network = recoil_1.useRecoilValue(wallet_1.networkState);
    var _j = useCurrencyPair_1["default"]({
        persistSelectedCurrencies: persistSelectedCurrencies,
        defaultBaseCurrencyKey: defaultBaseCurrencyKey,
        defaultQuoteCurrencyKey: defaultQuoteCurrencyKey
    }), currencyPair = _j[0], setCurrencyPair = _j[1];
    var _k = react_1.useState(false), hasSetCostOutputTokenCalled = _k[0], setHasSetCostOutputTokenCalled = _k[1];
    var _l = react_1.useState(''), baseCurrencyAmount = _l[0], setBaseCurrencyAmount = _l[1];
    var _m = react_1.useState(''), quoteCurrencyAmount = _m[0], setQuoteCurrencyAmount = _m[1];
    var _o = react_1.useState(null), baseCurrencyAddress = _o[0], setBaseCurrencyAddress = _o[1];
    var _p = react_1.useState(null), quoteCurrencyAddress = _p[0], setQuoteCurrencyAddress = _p[1];
    var _q = react_1.useState(null), smartOrderRouter = _q[0], setSmartOrderRouter = _q[1];
    var _r = react_1.useState(null), balancerProxyContract = _r[0], setBalancerProxyContract = _r[1];
    var _s = react_1.useState(null), approveError = _s[0], setApproveError = _s[1];
    var _t = react_1.useState(false), isApproving = _t[0], setIsApproving = _t[1];
    var _u = react_1.useState(null), baseAllowance = _u[0], setBaseAllowance = _u[1];
    var _v = react_1.useState(false), approveModalOpen = _v[0], setApproveModalOpen = _v[1];
    var _w = react_1.useState('0'), maxSlippageTolerance = _w[0], setMaxSlippageTolerance = _w[1];
    var _x = react_1.useState(new bignumber_js_1.BigNumber(0)), estimatedSlippage = _x[0], setEstimatedSlippage = _x[1];
    // TODO type swaps
    var _y = react_1.useState(null), swaps = _y[0], setSwaps = _y[1];
    var _z = react_1.useState(false), isSubmitting = _z[0], setIsSubmitting = _z[1];
    var isWalletConnected = recoil_1.useRecoilValue(wallet_1.isWalletConnectedState);
    var walletAddress = recoil_1.useRecoilValue(wallet_1.walletAddressState);
    var _0 = react_1.useState(false), txConfirmationModalOpen = _0[0], setTxConfirmationModalOpen = _0[1];
    var _1 = react_1.useState(false), txError = _1[0], setTxError = _1[1];
    var setOrders = recoil_1.useSetRecoilState(orders_1.ordersState);
    var setHasOrdersNotification = recoil_1.useSetRecoilState(ui_1.hasOrdersNotificationState);
    var gasSpeed = recoil_1.useRecoilValue(wallet_1.gasSpeedState);
    var customGasPrice = recoil_1.useRecoilValue(wallet_1.customGasPriceState);
    // TODO get from pool
    var exchangeFeeRate = 0.003;
    var baseCurrencyKey = currencyPair.base, quoteCurrencyKey = currencyPair.quote;
    var synthsWalletBalancesQuery = useSynthsBalancesQuery_1["default"]();
    var ethGasPriceQuery = useEthGasPriceQuery_1["default"]();
    var feeReclaimPeriodQuery = useFeeReclaimPeriodQuery_1["default"](quoteCurrencyKey);
    var selectPriceCurrencyRate = useSelectedPriceCurrency_1["default"]().selectPriceCurrencyRate;
    var feeReclaimPeriodInSeconds = feeReclaimPeriodQuery.isSuccess
        ? (_b = feeReclaimPeriodQuery.data) !== null && _b !== void 0 ? _b : 0 : 0;
    var baseCurrencyBalance = baseCurrencyKey != null && synthsWalletBalancesQuery.isSuccess
        ? get_1["default"](synthsWalletBalancesQuery.data, ['balancesMap', baseCurrencyKey, 'balance'], number_1.zeroBN)
        : null;
    var quoteCurrencyBalance = null;
    if (quoteCurrencyKey != null) {
        quoteCurrencyBalance = synthsWalletBalancesQuery.isSuccess
            ? get_1["default"](synthsWalletBalancesQuery.data, ['balancesMap', quoteCurrencyKey, 'balance'], number_1.zeroBN)
            : null;
    }
    var baseCurrencyAmountBN = number_1.toBigNumber(baseCurrencyAmount !== '' ? baseCurrencyAmount : 0);
    var quoteCurrencyAmountBN = number_1.toBigNumber(quoteCurrencyAmount !== '' ? quoteCurrencyAmount : 0);
    var selectedBothSides = baseCurrencyKey != null && quoteCurrencyKey != null;
    var basePriceRate = baseCurrencyKey === currency_1.SYNTHS_MAP.sUSD
        ? currency_1.sUSD_EXCHANGE_RATE
        : baseCurrencyAmountBN.div(quoteCurrencyAmountBN).toNumber();
    var quotePriceRate = quoteCurrencyKey === currency_1.SYNTHS_MAP.sUSD
        ? currency_1.sUSD_EXCHANGE_RATE
        : quoteCurrencyAmountBN.div(baseCurrencyAmountBN).toNumber();
    var totalTradePrice = baseCurrencyKey === currency_1.SYNTHS_MAP.sUSD
        ? baseCurrencyAmountBN.multipliedBy(basePriceRate)
        : quoteCurrencyAmountBN.multipliedBy(quotePriceRate);
    if (selectPriceCurrencyRate) {
        totalTradePrice = totalTradePrice.dividedBy(selectPriceCurrencyRate);
    }
    var submissionDisabledReason = react_1.useMemo(function () {
        var insufficientBalance = quoteCurrencyBalance != null ? quoteCurrencyAmountBN.gt(quoteCurrencyBalance) : false;
        if (baseAllowance == null ||
            baseAllowance === '0' ||
            quoteCurrencyAmountBN.times(1e18).gte(baseAllowance)) {
            return 'approve-balancer';
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
        if (!isWalletConnected ||
            baseCurrencyAmountBN.isNaN() ||
            quoteCurrencyAmountBN.isNaN() ||
            baseCurrencyAmountBN.lte(0) ||
            quoteCurrencyAmountBN.lte(0)) {
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
        baseAllowance,
        isApproving,
    ]);
    var noSynths = synthsWalletBalancesQuery.isSuccess && synthsWalletBalancesQuery.data
        ? synthsWalletBalancesQuery.data.balances.length === 0
        : false;
    var handleCurrencySwap = function () {
        var baseAmount = baseCurrencyAmount;
        var quoteAmount = quoteCurrencyAmount;
        setCurrencyPair({
            base: quoteCurrencyKey,
            quote: baseCurrencyKey
        });
        setBaseCurrencyAmount(quoteAmount);
        setQuoteCurrencyAmount(baseAmount);
    };
    var gasPrice = react_1.useMemo(function () {
        return customGasPrice !== ''
            ? Number(customGasPrice)
            : ethGasPriceQuery.data != null
                ? ethGasPriceQuery.data[gasSpeed]
                : null;
    }, [customGasPrice, ethGasPriceQuery.data, gasSpeed]);
    var feeAmountInBaseCurrency = react_1.useMemo(function () {
        if (exchangeFeeRate != null && baseCurrencyAmount) {
            return number_1.toBigNumber(baseCurrencyAmount).multipliedBy(exchangeFeeRate);
        }
        return null;
    }, [baseCurrencyAmount, exchangeFeeRate]);
    react_1.useEffect(function () {
        if ((synthetix_1["default"] === null || synthetix_1["default"] === void 0 ? void 0 : synthetix_1["default"].js) != null &&
            provider != null &&
            gasPrice != null &&
            (network === null || network === void 0 ? void 0 : network.id) != null &&
            (network.id === js_1.NetworkId.Mainnet || network.id === js_1.NetworkId.Kovan)) {
            var maxNoPools = 1;
            var sor = new sor_1.SOR(provider, new bignumber_js_1.BigNumber(gasPrice), maxNoPools, network === null || network === void 0 ? void 0 : network.id, BALANCER_LINKS[network.id].poolsUrl);
            setSmartOrderRouter(sor);
        }
    }, [provider, gasPrice, network === null || network === void 0 ? void 0 : network.id]);
    var getAllowanceAndInitProxyContract = react_1.useCallback(function (_a) {
        var address = _a.address, key = _a.key, id = _a.id, contractNeedsInit = _a.contractNeedsInit;
        return __awaiter(void 0, void 0, void 0, function () {
            var proxyContract, allowance;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(address != null &&
                            key != null &&
                            (synthetix_1["default"] === null || synthetix_1["default"] === void 0 ? void 0 : synthetix_1["default"].js) != null &&
                            provider != null &&
                            id != null &&
                            (id === js_1.NetworkId.Mainnet || id === js_1.NetworkId.Kovan))) return [3 /*break*/, 2];
                        if (contractNeedsInit) {
                            proxyContract = new ethers_1.ethers.Contract(BALANCER_LINKS[id].proxyAddr, balancerExchangeProxyABI_1["default"], provider);
                            setBalancerProxyContract(proxyContract);
                        }
                        return [4 /*yield*/, synthetix_1["default"].js.contracts["Synth" + key].allowance(address, BALANCER_LINKS[id].proxyAddr)];
                    case 1:
                        allowance = _b.sent();
                        setBaseAllowance(allowance.toString());
                        _b.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    }, [provider]);
    react_1.useEffect(function () {
        var _a;
        getAllowanceAndInitProxyContract({
            address: walletAddress,
            key: quoteCurrencyKey,
            id: (_a = network === null || network === void 0 ? void 0 : network.id) !== null && _a !== void 0 ? _a : null,
            contractNeedsInit: true
        });
    }, [walletAddress, quoteCurrencyKey, network === null || network === void 0 ? void 0 : network.id, getAllowanceAndInitProxyContract]);
    react_1.useEffect(function () {
        if ((synthetix_1["default"] === null || synthetix_1["default"] === void 0 ? void 0 : synthetix_1["default"].js) && baseCurrencyKey != null && quoteCurrencyKey != null) {
            setBaseCurrencyAddress(synthetix_1["default"].js.contracts["Synth" + baseCurrencyKey].address);
            setQuoteCurrencyAddress(synthetix_1["default"].js.contracts["Synth" + quoteCurrencyKey].address);
        }
    }, [baseCurrencyKey, quoteCurrencyKey]);
    var calculateExchangeRate = react_1.useCallback(function (_a) {
        var value = _a.value, isBase = _a.isBase;
        return __awaiter(void 0, void 0, void 0, function () {
            var swapType, formattedValue, _b, tradeSwaps, resultingAmount, _c, smallTradeResult;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        if (!(smartOrderRouter != null && quoteCurrencyAddress != null && baseCurrencyAddress != null)) return [3 /*break*/, 6];
                        swapType = isBase ? 'swapExactIn' : 'swapExactOut';
                        formattedValue = value.times(1e18);
                        return [4 /*yield*/, smartOrderRouter.fetchPools()];
                    case 1:
                        _d.sent();
                        if (!!hasSetCostOutputTokenCalled) return [3 /*break*/, 3];
                        return [4 /*yield*/, smartOrderRouter.setCostOutputToken(quoteCurrencyAddress)];
                    case 2:
                        _d.sent();
                        setHasSetCostOutputTokenCalled(true);
                        _d.label = 3;
                    case 3: return [4 /*yield*/, smartOrderRouter.getSwaps(quoteCurrencyAddress, baseCurrencyAddress, swapType, formattedValue)];
                    case 4:
                        _b = _d.sent(), tradeSwaps = _b[0], resultingAmount = _b[1];
                        return [4 /*yield*/, smartOrderRouter.getSwaps(quoteCurrencyAddress, baseCurrencyAddress, swapType, new bignumber_js_1.BigNumber(1).times(1e18))];
                    case 5:
                        _c = _d.sent(), smallTradeResult = _c[1];
                        setEstimatedSlippage(resultingAmount.div(smallTradeResult));
                        setSwaps(tradeSwaps);
                        isBase
                            ? setBaseCurrencyAmount(resultingAmount.toString())
                            : setQuoteCurrencyAmount(resultingAmount.toString());
                        _d.label = 6;
                    case 6: return [2 /*return*/];
                }
            });
        });
    }, [smartOrderRouter, quoteCurrencyAddress, baseCurrencyAddress, hasSetCostOutputTokenCalled]);
    var handleApprove = react_1.useCallback(function () { return __awaiter(void 0, void 0, void 0, function () {
        var contracts, gasLimitEstimate, allowanceTx, emitter, link_1, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(gasPrice != null && balancerProxyContract != null)) return [3 /*break*/, 5];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    contracts = synthetix_1["default"].js.contracts;
                    setIsApproving(true);
                    setApproveError(null);
                    setApproveModalOpen(true);
                    return [4 /*yield*/, contracts["Synth" + quoteCurrencyKey].estimateGas.approve(balancerProxyContract.address, ethers_1.ethers.constants.MaxUint256)];
                case 2:
                    gasLimitEstimate = _a.sent();
                    return [4 /*yield*/, contracts["Synth" + quoteCurrencyKey].approve(balancerProxyContract.address, ethers_1.ethers.constants.MaxUint256, {
                            gasPrice: network_1.gasPriceInWei(gasPrice),
                            gasLimit: network_1.normalizeGasLimit(gasLimitEstimate.toNumber())
                        })];
                case 3:
                    allowanceTx = _a.sent();
                    if (allowanceTx && notify) {
                        emitter = notify.hash(allowanceTx.hash).emitter;
                        link_1 = etherscanInstance != null ? etherscanInstance.txLink(allowanceTx.hash) : undefined;
                        emitter.on('txConfirmed', function () {
                            var _a;
                            getAllowanceAndInitProxyContract({
                                address: walletAddress,
                                key: quoteCurrencyKey,
                                id: (_a = network === null || network === void 0 ? void 0 : network.id) !== null && _a !== void 0 ? _a : null,
                                contractNeedsInit: false
                            });
                            return {
                                autoDismiss: 0,
                                link: link_1
                            };
                        });
                        emitter.on('all', function () {
                            return {
                                link: link_1
                            };
                        });
                    }
                    return [3 /*break*/, 5];
                case 4:
                    e_1 = _a.sent();
                    console.log(e_1);
                    setApproveError(e_1.message);
                    setIsApproving(false);
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    }); }, [
        gasPrice,
        balancerProxyContract,
        etherscanInstance,
        walletAddress,
        network === null || network === void 0 ? void 0 : network.id,
        getAllowanceAndInitProxyContract,
        notify,
        quoteCurrencyKey,
    ]);
    var handleSubmit = react_1.useCallback(function () { return __awaiter(void 0, void 0, void 0, function () {
        var gasPriceWei, slippageTolerance, tx_1, emitter, link_2, e_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(synthetix_1["default"].js != null &&
                        gasPrice != null &&
                        (balancerProxyContract === null || balancerProxyContract === void 0 ? void 0 : balancerProxyContract.address) != null &&
                        provider != null)) return [3 /*break*/, 5];
                    setTxError(false);
                    setTxConfirmationModalOpen(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    setIsSubmitting(true);
                    gasPriceWei = network_1.gasPriceInWei(gasPrice);
                    slippageTolerance = new bignumber_js_1.BigNumber(maxSlippageTolerance);
                    return [4 /*yield*/, balancerProxyContract.multihopBatchSwapExactIn(swaps, quoteCurrencyAddress, baseCurrencyAddress, quoteCurrencyAmountBN.times(1e18).toString(), baseCurrencyAmountBN
                            .times(1e18)
                            .times(new bignumber_js_1.BigNumber(1).minus(slippageTolerance))
                            .toString(), {
                            gasPrice: gasPriceWei.toString()
                        })];
                case 2:
                    tx_1 = _a.sent();
                    if (tx_1) {
                        setOrders(function (orders) {
                            return immer_1["default"](orders, function (draftState) {
                                draftState.push({
                                    timestamp: Date.now(),
                                    hash: tx_1.hash,
                                    baseCurrencyKey: baseCurrencyKey,
                                    baseCurrencyAmount: baseCurrencyAmount,
                                    quoteCurrencyKey: quoteCurrencyKey,
                                    quoteCurrencyAmount: quoteCurrencyAmount,
                                    orderType: 'market',
                                    status: 'pending',
                                    transaction: tx_1
                                });
                            });
                        });
                        setHasOrdersNotification(true);
                        if (notify) {
                            emitter = notify.hash(tx_1.hash).emitter;
                            link_2 = etherscanInstance != null ? etherscanInstance.txLink(tx_1.hash) : undefined;
                            emitter.on('txConfirmed', function () {
                                setOrders(function (orders) {
                                    return immer_1["default"](orders, function (draftState) {
                                        var orderIndex = orders.findIndex(function (order) { return order.hash === tx_1.hash; });
                                        if (draftState[orderIndex]) {
                                            draftState[orderIndex].status = 'confirmed';
                                        }
                                    });
                                });
                                synthsWalletBalancesQuery.refetch();
                                return {
                                    autoDismiss: 0,
                                    link: link_2
                                };
                            });
                            emitter.on('all', function () {
                                return {
                                    link: link_2
                                };
                            });
                        }
                    }
                    setTxConfirmationModalOpen(false);
                    return [3 /*break*/, 5];
                case 3:
                    e_2 = _a.sent();
                    console.log(e_2);
                    setTxError(true);
                    return [3 /*break*/, 5];
                case 4:
                    setIsSubmitting(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); }, [
        gasPrice,
        balancerProxyContract,
        swaps,
        baseCurrencyAddress,
        quoteCurrencyAddress,
        baseCurrencyAmountBN,
        quoteCurrencyAmountBN,
        baseCurrencyAmount,
        baseCurrencyKey,
        quoteCurrencyAmount,
        quoteCurrencyKey,
        provider,
        notify,
        etherscanInstance,
        synthsWalletBalancesQuery,
        setOrders,
        setHasOrdersNotification,
        maxSlippageTolerance,
    ]);
    var handleAmountChange = react_1.useCallback(function (_a) {
        var value = _a.value, isBase = _a.isBase, _b = _a.isMaxClick, isMaxClick = _b === void 0 ? false : _b;
        if (value === '' && !isMaxClick) {
            setBaseCurrencyAmount('');
            setQuoteCurrencyAmount('');
        }
        else if (isBase) {
            var baseAmount = isMaxClick ? (baseCurrencyBalance !== null && baseCurrencyBalance !== void 0 ? baseCurrencyBalance : 0).toString() : value;
            setBaseCurrencyAmount(baseAmount);
            calculateExchangeRate({ value: new bignumber_js_1.BigNumber(baseAmount), isBase: isBase });
        }
        else {
            var quoteAmount = isMaxClick ? (quoteCurrencyBalance !== null && quoteCurrencyBalance !== void 0 ? quoteCurrencyBalance : 0).toString() : value;
            setQuoteCurrencyAmount(quoteAmount);
            calculateExchangeRate({ value: new bignumber_js_1.BigNumber(quoteAmount), isBase: isBase });
        }
    }, [baseCurrencyBalance, quoteCurrencyBalance, calculateExchangeRate]);
    var handleAmountChangeBase = react_1.useCallback(function (value) { return handleAmountChange({ value: value, isBase: true }); }, [handleAmountChange]);
    var handleAmountChangeQuote = react_1.useCallback(function (value) { return handleAmountChange({ value: value, isBase: false }); }, [handleAmountChange]);
    var handleAmountChangeBaseMaxClick = react_1.useCallback(function () { return handleAmountChange({ value: '', isBase: true, isMaxClick: true }); }, [handleAmountChange]);
    var handleAmountChangeQuoteMaxClick = react_1.useCallback(function () { return handleAmountChange({ value: '', isBase: false, isMaxClick: true }); }, [handleAmountChange]);
    var quoteCurrencyCard = (<StyledCurrencyCard side="quote" currencyKey={quoteCurrencyKey} amount={quoteCurrencyAmount} onAmountChange={handleAmountChangeQuote} walletBalance={quoteCurrencyBalance} onBalanceClick={handleAmountChangeQuoteMaxClick} onCurrencySelect={undefined} priceRate={quotePriceRate}/>);
    var baseCurrencyCard = (<StyledCurrencyCard side="base" currencyKey={baseCurrencyKey} amount={baseCurrencyAmount} onAmountChange={handleAmountChangeBase} walletBalance={baseCurrencyBalance} onBalanceClick={handleAmountChangeBaseMaxClick} onCurrencySelect={undefined} priceRate={basePriceRate}/>);
    var footerCard = (<>
			{!isWalletConnected ? (<ConnectWalletCard_1["default"] attached={footerCardAttached}/>) : showNoSynthsCard && noSynths ? (<NoSynthsCard_1["default"] attached={footerCardAttached}/>) : (<TradeBalancerSummaryCard_1["default"] submissionDisabledReason={submissionDisabledReason} onSubmit={submissionDisabledReason === 'approve-balancer' ? handleApprove : handleSubmit} gasPrices={ethGasPriceQuery.data} estimatedSlippage={estimatedSlippage} maxSlippageTolerance={maxSlippageTolerance} setMaxSlippageTolerance={setMaxSlippageTolerance}/>)}
			{txConfirmationModalOpen && (<TxConfirmationModal_1["default"] onDismiss={function () { return setTxConfirmationModalOpen(false); }} txError={txError} attemptRetry={handleSubmit} baseCurrencyAmount={baseCurrencyAmount} quoteCurrencyAmount={quoteCurrencyAmount} feeAmountInBaseCurrency={feeAmountInBaseCurrency} baseCurrencyKey={baseCurrencyKey} quoteCurrencyKey={quoteCurrencyKey} totalTradePrice={totalTradePrice.toString()} txProvider={TX_PROVIDER}/>)}
			{approveModalOpen && (<BalancerApproveModal_1["default"] onDismiss={function () { return setApproveModalOpen(false); }} synth={quoteCurrencyKey} approveError={approveError}/>)}
		</>);
    return {
        quoteCurrencyCard: quoteCurrencyCard,
        baseCurrencyCard: baseCurrencyCard,
        footerCard: footerCard,
        handleCurrencySwap: handleCurrencySwap
    };
};
var StyledCurrencyCard = styled_components_1["default"](CurrencyCard_1["default"])(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n\talign-items: center;\n\tmargin-top: 2px;\n"], ["\n\talign-items: center;\n\tmargin-top: 2px;\n"])));
exports["default"] = useBalancerExchange;
var templateObject_1;
