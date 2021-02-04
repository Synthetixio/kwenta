"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
exports.__esModule = true;
var react_1 = require("react");
var styled_components_1 = require("styled-components");
var react_i18next_1 = require("react-i18next");
var react_optimized_image_1 = require("react-optimized-image");
var router_1 = require("next/router");
var date_1 = require("utils/formatters/date");
var number_1 = require("utils/formatters/number");
var placeholder_1 = require("constants/placeholder");
var routes_1 = require("constants/routes");
var common_1 = require("styles/common");
var Etherscan_1 = require("containers/Etherscan");
var Table_1 = require("components/Table");
var edit_svg_1 = require("assets/svg/app/edit.svg");
var link_svg_1 = require("assets/svg/app/link.svg");
var no_notifications_svg_1 = require("assets/svg/app/no-notifications.svg");
var useSelectedPriceCurrency_1 = require("hooks/useSelectedPriceCurrency");
var ShortingHistoryTable = function (_a) {
    var shortHistory = _a.shortHistory, isLoading = _a.isLoading, isLoaded = _a.isLoaded;
    var t = react_i18next_1.useTranslation().t;
    var etherscanInstance = Etherscan_1["default"].useContainer().etherscanInstance;
    var selectPriceCurrencyRate = useSelectedPriceCurrency_1["default"]().selectPriceCurrencyRate;
    var columnsDeps = react_1.useMemo(function () { return [selectPriceCurrencyRate]; }, [selectPriceCurrencyRate]);
    var router = router_1.useRouter();
    return (<StyledTable palette="primary" columns={[
        {
            Header: <StyledTableHeader>{t('shorting.history.table.id')}</StyledTableHeader>,
            accessor: 'id',
            Cell: function (cellProps) { return <WhiteText>{cellProps.row.original.id}</WhiteText>; },
            sortable: true,
            width: 50
        },
        {
            Header: <StyledTableHeader>{t('shorting.history.table.date')}</StyledTableHeader>,
            accessor: 'date',
            Cell: function (cellProps) { return (<WhiteText>{date_1.formatDateWithTime(cellProps.row.original.createdAt)}</WhiteText>); },
            width: 200,
            sortable: true
        },
        {
            Header: <StyledTableHeader>{t('shorting.history.table.shorting')}</StyledTableHeader>,
            accessor: 'synthBorrowedAmount',
            Cell: function (cellProps) { return (<span>
							<StyledCurrencyKey>{cellProps.row.original.synthBorrowed}</StyledCurrencyKey>
							<StyledPrice>{number_1.formatNumber(cellProps.row.original.synthBorrowedAmount)}</StyledPrice>
						</span>); },
            width: 200,
            sortable: true
        },
        {
            Header: <StyledTableHeader>{t('shorting.history.table.collateral')}</StyledTableHeader>,
            accessor: 'collateralLockedAmount',
            Cell: function (cellProps) { return (<span>
							<StyledCurrencyKey>{cellProps.row.original.collateralLocked}</StyledCurrencyKey>
							<StyledPrice>
								{number_1.formatNumber(cellProps.row.original.collateralLockedAmount)}
							</StyledPrice>
						</span>); },
            width: 200,
            sortable: true
        },
        {
            Header: (<StyledTableHeader>{t('shorting.history.table.liquidationPrice')}</StyledTableHeader>),
            accessor: 'liquidationPrice',
            Cell: function (cellProps) { return (<span>
							<StyledCurrencyKey>{cellProps.row.original.synthBorrowed}</StyledCurrencyKey>
							<StyledPrice>
								{number_1.formatNumber((cellProps.row.original.collateralLockedAmount *
                cellProps.row.original.collateralLockedPrice) /
                (cellProps.row.original.synthBorrowedAmount *
                    cellProps.row.original.contractData.minCratio))}
							</StyledPrice>
						</span>); },
            width: 200,
            sortable: true
        },
        {
            Header: <StyledTableHeader>{t('shorting.history.table.cRatio')}</StyledTableHeader>,
            accessor: 'cRatio',
            Cell: function (cellProps) { return (<PriceChangeText isPositive={true}>
							{number_1.formatPercent((cellProps.row.original.collateralLockedAmount *
                cellProps.row.original.collateralLockedPrice) /
                (cellProps.row.original.synthBorrowedAmount *
                    cellProps.row.original.synthBorrowedPrice))}
						</PriceChangeText>); },
            width: 200,
            sortable: true
        },
        {
            Header: <StyledTableHeader>{t('shorting.history.table.profitLoss')}</StyledTableHeader>,
            accessor: 'profitLoss',
            Cell: function () { return (<PriceChangeText isPositive={true}>
							
							{true ? '+' : '-'} {number_1.formatPercent(1)}
						</PriceChangeText>); },
            width: 200,
            sortable: true
        },
        {
            id: 'edit',
            Cell: function (cellProps) { return (<div onClick={function () {
                return router.push(routes_1["default"].Shorting.ManageShortAddCollateral(cellProps.row.original.id));
            }}>
							<StyledLinkIcon src={edit_svg_1["default"]} viewBox={"0 0 " + edit_svg_1["default"].width + " " + edit_svg_1["default"].height}/>
						</div>); },
            sortable: false
        },
        {
            id: 'link',
            Cell: function (cellProps) {
                return etherscanInstance != null && cellProps.row.original.txHash ? (<StyledExternalLink href={etherscanInstance.txLink(cellProps.row.original.txHash)}>
								<StyledLinkIcon src={link_svg_1["default"]} viewBox={"0 0 " + link_svg_1["default"].width + " " + link_svg_1["default"].height}/>
							</StyledExternalLink>) : (placeholder_1.NO_VALUE);
            },
            sortable: false
        },
    ]} columnsDeps={columnsDeps} data={shortHistory} isLoading={isLoading && !isLoaded} noResultsMessage={isLoaded && shortHistory.length === 0 ? (<TableNoResults>
						<react_optimized_image_1.Svg src={no_notifications_svg_1["default"]}/>
						{t('shorting.history.table.noResults')}
					</TableNoResults>) : undefined} showPagination={true}/>);
};
var StyledExternalLink = styled_components_1["default"](common_1.ExternalLink)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n\tmargin-left: auto;\n"], ["\n\tmargin-left: auto;\n"])));
var StyledLinkIcon = styled_components_1["default"](react_optimized_image_1.Svg)(templateObject_2 || (templateObject_2 = __makeTemplateObject(["\n\twidth: 14px;\n\theight: 14px;\n\tcolor: ", ";\n\t&:hover {\n\t\tcolor: ", ";\n\t}\n"], ["\n\twidth: 14px;\n\theight: 14px;\n\tcolor: ", ";\n\t&:hover {\n\t\tcolor: ", ";\n\t}\n"])), function (props) { return props.theme.colors.blueberry; }, function (props) { return props.theme.colors.goldColors.color1; });
var StyledTable = styled_components_1["default"](Table_1["default"])(templateObject_3 || (templateObject_3 = __makeTemplateObject(["\n\tmargin-top: 16px;\n"], ["\n\tmargin-top: 16px;\n"])));
var StyledTableHeader = styled_components_1["default"].div(templateObject_4 || (templateObject_4 = __makeTemplateObject(["\n\tfont-family: ", ";\n\tcolor: ", ";\n"], ["\n\tfont-family: ", ";\n\tcolor: ", ";\n"])), function (props) { return props.theme.fonts.bold; }, function (props) { return props.theme.colors.blueberry; });
var WhiteText = styled_components_1["default"].div(templateObject_5 || (templateObject_5 = __makeTemplateObject(["\n\tcolor: ", ";\n"], ["\n\tcolor: ", ";\n"])), function (props) { return props.theme.colors.white; });
var StyledCurrencyKey = styled_components_1["default"].span(templateObject_6 || (templateObject_6 = __makeTemplateObject(["\n\tcolor: ", ";\n\tpadding-right: 10px;\n"], ["\n\tcolor: ", ";\n\tpadding-right: 10px;\n"])), function (props) { return props.theme.colors.white; });
var StyledPrice = styled_components_1["default"].span(templateObject_7 || (templateObject_7 = __makeTemplateObject(["\n\tcolor: ", ";\n"], ["\n\tcolor: ", ";\n"])), function (props) { return props.theme.colors.silver; });
var PriceChangeText = styled_components_1["default"].span(templateObject_8 || (templateObject_8 = __makeTemplateObject(["\n\tcolor: ", ";\n"], ["\n\tcolor: ", ";\n"])), function (props) { return (props.isPositive ? props.theme.colors.green : props.theme.colors.red); });
var TableNoResults = styled_components_1["default"](common_1.GridDivCenteredRow)(templateObject_9 || (templateObject_9 = __makeTemplateObject(["\n\tpadding: 50px 0;\n\tjustify-content: center;\n\tbackground-color: ", ";\n\tmargin-top: -2px;\n\tjustify-items: center;\n\tgrid-gap: 10px;\n"], ["\n\tpadding: 50px 0;\n\tjustify-content: center;\n\tbackground-color: ", ";\n\tmargin-top: -2px;\n\tjustify-items: center;\n\tgrid-gap: 10px;\n"])), function (props) { return props.theme.colors.elderberry; });
exports["default"] = ShortingHistoryTable;
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9;
