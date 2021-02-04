"use strict";
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
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
exports.__esModule = true;
var react_1 = require("react");
var ethers_1 = require("ethers");
var recoil_1 = require("recoil");
var react_i18next_1 = require("react-i18next");
var react_optimized_image_1 = require("react-optimized-image");
var TxApproveModal_1 = require("sections/shared/modals/TxApproveModal");
var circle_arrow_right_svg_1 = require("assets/svg/app/circle-arrow-right.svg");
var currency_1 = require("constants/currency");
var currencies_1 = require("utils/currencies");
var synthetix_1 = require("lib/synthetix");
var network_1 = require("utils/network");
var ConnectWalletCard_1 = require("sections/exchange/FooterCard/ConnectWalletCard");
var TxConfirmationModal_1 = require("sections/shared/modals/TxConfirmationModal");
var useEthGasPriceQuery_1 = require("queries/network/useEthGasPriceQuery");
var useCollateralShortIssuanceFee_1 = require("queries/collateral/useCollateralShortIssuanceFee");
var useSynthsBalancesQuery_1 = require("queries/walletBalances/useSynthsBalancesQuery");
var TradeSummaryCard_1 = require("sections/exchange/FooterCard/TradeSummaryCard");
var Connector_1 = require("containers/Connector");
var Notify_1 = require("containers/Notify");
var useShortHistoryQuery_1 = require("queries/short/useShortHistoryQuery");
var CurrencyCard_1 = require("sections/exchange/TradeCard/CurrencyCard");
var useSelectedPriceCurrency_1 = require("hooks/useSelectedPriceCurrency");
var useExchangeRatesQuery_1 = require("queries/rates/useExchangeRatesQuery");
var number_1 = require("utils/formatters/number");
var wallet_1 = require("store/wallet");
var common_1 = require("styles/common");
var ManageShort_1 = require("./ManageShort");
var ManageShortAction = function (_a) {
    var _b, _c, _d, _e;
    var short = _a.short, tab = _a.tab, isActive = _a.isActive;
    var t = react_i18next_1.useTranslation().t;
    var _f = react_1.useState(false), isApproving = _f[0], setIsApproving = _f[1];
    var _g = react_1.useState(false), isApproved = _g[0], setIsApproved = _g[1];
    var isWalletConnected = recoil_1.useRecoilValue(wallet_1.isWalletConnectedState);
    var _h = react_1.useState(false), txConfirmationModalOpen = _h[0], setTxConfirmationModalOpen = _h[1];
    var _j = react_1.useState(false), txApproveModalOpen = _j[0], setTxApproveModalOpen = _j[1];
    var _k = react_1.useState(false), isSubmitting = _k[0], setIsSubmitting = _k[1];
    var _l = react_1.useState(''), inputAmount = _l[0], setInputAmount = _l[1];
    var _m = react_1.useState(null), gasLimit = _m[0], setGasLimit = _m[1];
    var _o = react_1.useState(null), txError = _o[0], setTxError = _o[1];
    var notify = Connector_1["default"].useContainer().notify;
    var monitorHash = Notify_1["default"].useContainer().monitorHash;
    var shortHistoryQuery = useShortHistoryQuery_1["default"]();
    var _p = useSelectedPriceCurrency_1["default"](), selectPriceCurrencyRate = _p.selectPriceCurrencyRate, selectedPriceCurrency = _p.selectedPriceCurrency;
    var exchangeRatesQuery = useExchangeRatesQuery_1["default"]();
    var ethGasPriceQuery = useEthGasPriceQuery_1["default"]();
    var customGasPrice = recoil_1.useRecoilValue(wallet_1.customGasPriceState);
    var gasSpeed = recoil_1.useRecoilValue(wallet_1.gasSpeedState);
    var walletAddress = recoil_1.useRecoilValue(wallet_1.walletAddressState);
    var synthsWalletBalancesQuery = useSynthsBalancesQuery_1["default"]();
    var collateralShortIssuanceFeeQuery = useCollateralShortIssuanceFee_1["default"]();
    var collateralShortIssuanceFee = collateralShortIssuanceFeeQuery.isSuccess
        ? (_b = collateralShortIssuanceFeeQuery.data) !== null && _b !== void 0 ? _b : null : null;
    var needsApproval = tab === ManageShort_1.ShortingTab.AddCollateral;
    var isCollateralChange = tab === ManageShort_1.ShortingTab.AddCollateral || tab === ManageShort_1.ShortingTab.RemoveCollateral;
    var currencyKey = isCollateralChange ? short.collateralLocked : short.synthBorrowed;
    var balance = (_d = (_c = synthsWalletBalancesQuery.data) === null || _c === void 0 ? void 0 : _c.balancesMap[currencyKey].balance) !== null && _d !== void 0 ? _d : null;
    var inputAmountBN = react_1.useMemo(function () { return number_1.toBigNumber(inputAmount !== null && inputAmount !== void 0 ? inputAmount : 0); }, [inputAmount]);
    var getMethodAndParams = function (isEstimate) {
        if (isEstimate === void 0) { isEstimate = false; }
        var idParam = ethers_1.ethers.utils.parseUnits(String(short.id), currency_1.DEFAULT_TOKEN_DECIMALS);
        var amountParam = ethers_1.ethers.utils.parseUnits(inputAmountBN.toString(), currency_1.DEFAULT_TOKEN_DECIMALS);
        var params;
        var tx;
        switch (tab) {
            case ManageShort_1.ShortingTab.AddCollateral:
                params = [walletAddress, idParam, amountParam];
                tx = isEstimate
                    ? synthetix_1["default"].js.contracts.CollateralShort.estimateGas.deposit
                    : synthetix_1["default"].js.contracts.CollateralShort.deposit;
                break;
            case ManageShort_1.ShortingTab.RemoveCollateral:
                params = [idParam, amountParam];
                tx = isEstimate
                    ? synthetix_1["default"].js.contracts.CollateralShort.estimateGas.withdraw
                    : synthetix_1["default"].js.contracts.CollateralShort.withdraw;
                break;
            case ManageShort_1.ShortingTab.DecreasePosition:
                params = [walletAddress, idParam, amountParam];
                tx = isEstimate
                    ? synthetix_1["default"].js.contracts.CollateralShort.estimateGas.repay
                    : synthetix_1["default"].js.contracts.CollateralShort.repay;
                break;
            case ManageShort_1.ShortingTab.IncreasePosition:
                params = [idParam, amountParam];
                tx = isEstimate
                    ? synthetix_1["default"].js.contracts.CollateralShort.estimateGas.draw
                    : synthetix_1["default"].js.contracts.CollateralShort.draw;
                break;
            default:
                throw new Error('unrecognized tab');
        }
        return { tx: tx, params: params };
    };
    var gasPrice = react_1.useMemo(function () {
        return customGasPrice !== ''
            ? Number(customGasPrice)
            : ethGasPriceQuery.data != null
                ? ethGasPriceQuery.data[gasSpeed]
                : null;
    }, [customGasPrice, ethGasPriceQuery.data, gasSpeed]);
    var exchangeRates = exchangeRatesQuery.isSuccess ? (_e = exchangeRatesQuery.data) !== null && _e !== void 0 ? _e : null : null;
    var assetPriceRate = react_1.useMemo(function () { return currencies_1.getExchangeRatesForCurrencies(exchangeRates, currencyKey, selectedPriceCurrency.name); }, [exchangeRates, currencyKey, selectedPriceCurrency.name]);
    var ethPriceRate = react_1.useMemo(function () { return currencies_1.getExchangeRatesForCurrencies(exchangeRates, currency_1.SYNTHS_MAP.sETH, selectedPriceCurrency.name); }, [exchangeRates, selectedPriceCurrency.name]);
    var totalTradePrice = react_1.useMemo(function () {
        if (inputAmountBN.isNaN()) {
            return number_1.zeroBN;
        }
        var tradePrice = inputAmountBN.multipliedBy(assetPriceRate);
        if (selectPriceCurrencyRate) {
            tradePrice = tradePrice.dividedBy(selectPriceCurrencyRate);
        }
        return tradePrice;
    }, [inputAmountBN, assetPriceRate, selectPriceCurrencyRate]);
    var submissionDisabledReason = react_1.useMemo(function () {
        if (!isWalletConnected || inputAmountBN.isNaN() || inputAmountBN.lte(0)) {
            return 'enter-amount';
        }
        if (inputAmountBN.gt(balance !== null && balance !== void 0 ? balance : 0)) {
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
    var getGasLimitEstimate = react_1.useCallback(function () { return __awaiter(void 0, void 0, void 0, function () {
        var _a, tx, params, gasEstimate, e_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    _a = getMethodAndParams(true), tx = _a.tx, params = _a.params;
                    return [4 /*yield*/, tx(params)];
                case 1:
                    gasEstimate = _b.sent();
                    return [2 /*return*/, network_1.normalizeGasLimit(Number(gasEstimate))];
                case 2:
                    e_1 = _b.sent();
                    console.log('getGasEstimate error:', e_1);
                    return [2 /*return*/, null];
                case 3: return [2 /*return*/];
            }
        });
    }); }, [getMethodAndParams, network_1.normalizeGasLimit]);
    react_1.useEffect(function () {
        function updateGasLimit() {
            return __awaiter(this, void 0, void 0, function () {
                var newGasLimit;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!!isActive) return [3 /*break*/, 1];
                            setGasLimit(null);
                            return [3 /*break*/, 3];
                        case 1:
                            if (!(isActive && gasLimit == null && submissionDisabledReason == null)) return [3 /*break*/, 3];
                            return [4 /*yield*/, getGasLimitEstimate()];
                        case 2:
                            newGasLimit = _a.sent();
                            setGasLimit(newGasLimit);
                            _a.label = 3;
                        case 3: return [2 /*return*/];
                    }
                });
            });
        }
        updateGasLimit();
    }, [submissionDisabledReason, gasLimit, isActive, getGasLimitEstimate]);
    var handleSubmit = function () { return __awaiter(void 0, void 0, void 0, function () {
        var transaction, gasPriceWei, gasLimitEstimate, _a, tx, params, e_2;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!(synthetix_1["default"].js != null && gasPrice != null)) return [3 /*break*/, 6];
                    setTxError(null);
                    setTxConfirmationModalOpen(true);
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 4, 5, 6]);
                    setIsSubmitting(true);
                    transaction = null;
                    gasPriceWei = network_1.gasPriceInWei(gasPrice);
                    return [4 /*yield*/, getGasLimitEstimate()];
                case 2:
                    gasLimitEstimate = _b.sent();
                    setGasLimit(gasLimitEstimate);
                    _a = getMethodAndParams(true), tx = _a.tx, params = _a.params;
                    return [4 /*yield*/, tx.apply(void 0, __spreadArrays(params, [{
                                gasPrice: gasPriceWei,
                                gasLimit: gasLimitEstimate
                            }]))];
                case 3:
                    transaction = (_b.sent());
                    if (transaction != null && notify != null) {
                        monitorHash({
                            txHash: transaction.hash,
                            onTxConfirmed: function () { return shortHistoryQuery.refetch(); }
                        });
                    }
                    setTxConfirmationModalOpen(false);
                    return [3 /*break*/, 6];
                case 4:
                    e_2 = _b.sent();
                    console.log(e_2);
                    setTxError(e_2.message);
                    return [3 /*break*/, 6];
                case 5:
                    setIsSubmitting(false);
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    var approve = function () { return __awaiter(void 0, void 0, void 0, function () {
        var contracts, collateralContract, gasEstimate, gasPriceWei, tx, e_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(currencyKey != null && gasPrice != null)) return [3 /*break*/, 5];
                    setTxError(null);
                    setTxApproveModalOpen(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    setIsApproving(true);
                    contracts = synthetix_1["default"].js.contracts;
                    collateralContract = contracts[currencies_1.synthToContractName(currencyKey)];
                    return [4 /*yield*/, collateralContract.estimateGas.approve(contracts.CollateralShort.address, ethers_1.ethers.constants.MaxUint256)];
                case 2:
                    gasEstimate = _a.sent();
                    gasPriceWei = network_1.gasPriceInWei(gasPrice);
                    return [4 /*yield*/, collateralContract.approve(contracts.CollateralShort.address, ethers_1.ethers.constants.MaxUint256, {
                            gasLimit: network_1.normalizeGasLimit(Number(gasEstimate)),
                            gasPrice: gasPriceWei
                        })];
                case 3:
                    tx = _a.sent();
                    if (tx != null) {
                        monitorHash({
                            txHash: tx.hash,
                            onTxConfirmed: function () {
                                setIsApproving(false);
                                setIsApproved(true);
                            }
                        });
                    }
                    setTxApproveModalOpen(false);
                    return [3 /*break*/, 5];
                case 4:
                    e_3 = _a.sent();
                    console.log(e_3);
                    setIsApproving(false);
                    setTxError(e_3.message);
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var transactionFee = react_1.useMemo(function () { return network_1.getTransactionPrice(gasPrice, gasLimit, ethPriceRate); }, [
        gasPrice,
        gasLimit,
        ethPriceRate,
    ]);
    var issuanceFee = react_1.useMemo(function () {
        if (collateralShortIssuanceFee != null && inputAmountBN.gt(0)) {
            return inputAmountBN.multipliedBy(collateralShortIssuanceFee);
        }
        return null;
    }, [inputAmountBN, collateralShortIssuanceFee]);
    var feeCost = react_1.useMemo(function () {
        if (issuanceFee != null) {
            return issuanceFee.multipliedBy(assetPriceRate);
        }
        return null;
    }, [issuanceFee, assetPriceRate]);
    var currency = currencyKey != null && synthetix_1["default"].synthsMap != null ? synthetix_1["default"].synthsMap[currencyKey] : null;
    return (<>
			{!isWalletConnected ? (<ConnectWalletCard_1["default"] attached={true}/>) : (<>
					<CurrencyCard_1["default"] side="base" currencyKey={currencyKey} amount={inputAmount} onAmountChange={setInputAmount} walletBalance={balance} onBalanceClick={function () { return (balance != null ? setInputAmount(balance.toString()) : null); }} priceRate={assetPriceRate} label={isCollateralChange
        ? t('shorting.history.manageShort.sections.panel.collateral')
        : t('shorting.history.manageShort.sections.panel.shorting')}/>
					<TradeSummaryCard_1["default"] attached={true} submissionDisabledReason={submissionDisabledReason} onSubmit={needsApproval ? (isApproved ? handleSubmit : approve) : handleSubmit} totalTradePrice={totalTradePrice.toString()} baseCurrencyAmount={inputAmount} basePriceRate={assetPriceRate} baseCurrency={currency} gasPrices={ethGasPriceQuery.data} feeReclaimPeriodInSeconds={0} quoteCurrencyKey={null} feeRate={collateralShortIssuanceFee} transactionFee={tab === ManageShort_1.ShortingTab.AddCollateral ? transactionFee : 0} feeCost={feeCost} showFee={true} isApproved={isApproved}/>
				</>)}
			{txApproveModalOpen && (<TxApproveModal_1["default"] onDismiss={function () { return setTxApproveModalOpen(false); }} txError={txError} attemptRetry={approve} currencyKey={currencyKey} currencyLabel={<common_1.NoTextTransform>{currencyKey}</common_1.NoTextTransform>}/>)}
			{txConfirmationModalOpen && (<TxConfirmationModal_1["default"] onDismiss={function () { return setTxConfirmationModalOpen(false); }} txError={txError} attemptRetry={handleSubmit} baseCurrencyAmount={inputAmountBN.toString()} quoteCurrencyAmount={'0'} feeAmountInBaseCurrency={null} baseCurrencyKey={currencyKey} quoteCurrencyKey={currencyKey} totalTradePrice={totalTradePrice.toString()} txProvider="synthetix" quoteCurrencyLabel={t('shorting.common.posting')} baseCurrencyLabel={t('shorting.common.shorting')} icon={<react_optimized_image_1.Svg src={circle_arrow_right_svg_1["default"]}/>}/>)}
		</>);
};
exports["default"] = ManageShortAction;
