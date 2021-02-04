"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
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
var styled_components_1 = require("styled-components");
var synthetix_1 = require("lib/synthetix");
var react_i18next_1 = require("react-i18next");
var recoil_1 = require("recoil");
var Select_1 = require("components/Select");
var app_1 = require("store/app");
var common_1 = require("styles/common");
var currency_1 = require("constants/currency");
var useShortHistoryQuery_1 = require("queries/short/useShortHistoryQuery");
var ShortingHistoryTable_1 = require("./ShortingHistoryTable");
var ShortingHistory = function () {
    var _a;
    var t = react_i18next_1.useTranslation().t;
    var isAppReady = recoil_1.useRecoilValue(app_1.appReadyState);
    var shortHistoryQuery = useShortHistoryQuery_1["default"]();
    var synthsAvailableToShort = react_1.useMemo(function () {
        if (isAppReady) {
            return synthetix_1["default"].js.synths.filter(function (synth) {
                return [currency_1.SYNTHS_MAP.sBTC, currency_1.SYNTHS_MAP.sETH].includes(synth.name);
            });
        }
        return [];
    }, [isAppReady]);
    var synthFilterList = react_1.useMemo(function () { return __spreadArrays([
        { label: t('shorting.history.assetsSort.allAssets'), key: 'ALL_SYNTHS' }
    ], synthsAvailableToShort.map(function (synth) { return ({ label: synth.name, key: synth.name }); })); }, [t, synthsAvailableToShort]);
    var datesFilterList = react_1.useMemo(function () { return [
        { label: t('shorting.history.datesSort.allDates'), key: 'ALL_DATES' },
        { label: t('shorting.history.datesSort.pastWeek'), key: 'PAST_WEEK' },
        { label: t('shorting.history.datesSort.pastMonth'), key: 'PAST_MONTH' },
        { label: t('shorting.history.datesSort.pastYear'), key: 'PAST_YEAR' },
    ]; }, [t]);
    var shortSizeFilterList = react_1.useMemo(function () { return [
        { label: t('shorting.history.datesSort.allSizes'), key: 'ALL_SIZES' },
        { label: '< 1000', key: 'LTET1000' },
        { label: '1000 < x < 10,000', key: 'GT1000LTET10000' },
        { label: '10,000 < x < 100,000', key: 'GT10000LTET100000' },
        { label: '100,000 < x < 1,000,000', key: 'GT100000LTET1000000' },
        { label: '1,000,000+', key: 'GT1000000' },
    ]; }, [t]);
    var _b = react_1.useState(synthFilterList[0]), synthFilter = _b[0], setSynthFilter = _b[1];
    var _c = react_1.useState(datesFilterList[0]), datesFilter = _c[0], setDatesFilter = _c[1];
    var _d = react_1.useState(shortSizeFilterList[0]), shortSize = _d[0], setShortSize = _d[1];
    // eslint-disable-next-line
    var synths = ((_a = synthetix_1["default"].js) === null || _a === void 0 ? void 0 : _a.synths) || [];
    var createSynthTypeFilter = react_1.useCallback(function (synths, synthFilter) { return function (short) {
        return synths
            .filter(function (synth) { return synth.name === synthFilter || synthFilter === 'ALL_SYNTHS'; })
            .map(function (synth) { return synth.name; })
            .indexOf(short.synthBorrowed) !== -1;
    }; }, []);
    var createDatesTypeFilter = react_1.useCallback(function (datesFilter) { return function (short) {
        var currentTime = new Date().getTime();
        var day = 86400 * 1000;
        switch (datesFilter) {
            case datesFilterList[1].key:
                return short.createdAt > currentTime - day * 7;
            case datesFilterList[2].key:
                return short.createdAt > currentTime - day * 30;
            case datesFilterList[3].key:
                return short.createdAt > currentTime - day * 365;
            default:
                return true;
        }
    }; }, [datesFilterList]);
    var createShortSizeFilter = react_1.useCallback(function (shortSize) { return function (short) {
        switch (shortSize) {
            case shortSizeFilterList[1].key:
                return short.synthBorrowedAmount <= 1000;
            case shortSizeFilterList[2].key:
                return 1000 < short.synthBorrowedAmount && short.synthBorrowedAmount <= 10000;
            case shortSizeFilterList[3].key:
                return 10000 < short.synthBorrowedAmount && short.synthBorrowedAmount <= 100000;
            case shortSizeFilterList[4].key:
                return 100000 < short.synthBorrowedAmount && short.synthBorrowedAmount <= 1000000;
            case shortSizeFilterList[5].key:
                return short.synthBorrowedAmount >= 1000000;
            default:
                return true;
        }
    }; }, [shortSizeFilterList]);
    var shortHistory = react_1.useMemo(function () { return shortHistoryQuery.data || []; }, [shortHistoryQuery.data]);
    var filteredShortHistory = react_1.useMemo(function () {
        return shortHistory
            .filter(createSynthTypeFilter(synths, synthFilter.key))
            .filter(createDatesTypeFilter(datesFilter.key))
            .filter(createShortSizeFilter(shortSize.key));
    }, [
        shortHistory,
        shortSize.key,
        datesFilter.key,
        synthFilter.key,
        synths,
        createSynthTypeFilter,
        createDatesTypeFilter,
        createShortSizeFilter,
    ]);
    return (<>
			<Filters>
				<Select_1["default"] inputId="synth-filter-list" formatOptionLabel={function (option) { return <common_1.CapitalizedText>{option.label}</common_1.CapitalizedText>; }} options={synthFilterList} value={synthFilter} onChange={function (option) {
        if (option) {
            setSynthFilter(option);
        }
    }}/>
				<Select_1["default"] inputId="order-type-list" formatOptionLabel={function (option) { return <common_1.CapitalizedText>{option.label}</common_1.CapitalizedText>; }} options={datesFilterList} value={datesFilter} onChange={function (option) {
        if (option) {
            setDatesFilter(option);
        }
    }}/>
				<Select_1["default"] inputId="order-size-list" formatOptionLabel={function (option) { return <common_1.CapitalizedText>{option.label}</common_1.CapitalizedText>; }} options={shortSizeFilterList} value={shortSize} onChange={function (option) {
        if (option) {
            setShortSize(option);
        }
    }}/>
			</Filters>
			<ShortingHistoryTable_1["default"] shortHistory={filteredShortHistory} isLoaded={shortHistoryQuery.isSuccess} isLoading={shortHistoryQuery.isLoading}/>
		</>);
};
var Filters = styled_components_1["default"](common_1.GridDiv)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n\tgrid-template-columns: repeat(3, 1fr);\n\tgrid-gap: 18px;\n"], ["\n\tgrid-template-columns: repeat(3, 1fr);\n\tgrid-gap: 18px;\n"])));
exports["default"] = ShortingHistory;
var templateObject_1;
