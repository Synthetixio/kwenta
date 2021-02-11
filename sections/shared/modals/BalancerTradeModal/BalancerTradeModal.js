"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
exports.__esModule = true;
var react_i18next_1 = require("react-i18next");
var styled_components_1 = require("styled-components");
var react_optimized_image_1 = require("react-optimized-image");
var balancer_svg_1 = require("assets/svg/providers/balancer.svg");
var arrows_svg_1 = require("assets/svg/app/arrows.svg");
var useBalancerExchange_1 = require("sections/exchange/hooks/useBalancerExchange");
var common_1 = require("styles/common");
var media_1 = require("styles/media");
var currency_1 = require("constants/currency");
var common_2 = require("../common");
var BalancerTradeModal = function (_a) {
    var onDismiss = _a.onDismiss;
    var t = react_i18next_1.useTranslation().t;
    var _b = useBalancerExchange_1["default"]({
        defaultBaseCurrencyKey: currency_1.SYNTHS_MAP.sTSLA,
        defaultQuoteCurrencyKey: currency_1.SYNTHS_MAP.sUSD,
        footerCardAttached: true,
        persistSelectedCurrencies: true,
        showNoSynthsCard: true
    }), quoteCurrencyCard = _b.quoteCurrencyCard, baseCurrencyCard = _b.baseCurrencyCard, handleCurrencySwap = _b.handleCurrencySwap, footerCard = _b.footerCard;
    return (<StyledCenteredModal onDismiss={onDismiss} isOpen={true} title={t('modals.afterHours.title', { synth: currency_1.SYNTHS_MAP.sTSLA })} lowercase={true}>
			<NoticeText>{t('modals.afterHours.notice-text', { synth: currency_1.SYNTHS_MAP.sTSLA })}</NoticeText>
			{quoteCurrencyCard}
			<VerticalSpacer>
				<common_1.SwapCurrenciesButton onClick={handleCurrencySwap} data-testid="swap-btn">
					<react_optimized_image_1.Svg src={arrows_svg_1["default"]}/>
				</common_1.SwapCurrenciesButton>
			</VerticalSpacer>
			{baseCurrencyCard}
			{footerCard}
			<PoweredBySection>
				<div>{t('modals.afterHours.powered-by-balancer')}</div>
				<PaddedImg alt={t('common.dex-aggregators.balancer.title')} src={balancer_svg_1["default"]} width="20px" height="25px"/>
			</PoweredBySection>
		</StyledCenteredModal>);
};
var StyledCenteredModal = styled_components_1["default"](common_2.CenteredModal)(templateObject_2 || (templateObject_2 = __makeTemplateObject(["\n\t.currency-card {\n\t\twidth: 312px;\n\t\t", "\n\t}\n\t.card {\n\t\tbackground-color: ", ";\n\t\twidth: 400px;\n\t\tmargin: 0 auto;\n\t\tpadding: 0 20px;\n\t}\n"], ["\n\t.currency-card {\n\t\twidth: 312px;\n\t\t",
    "\n\t}\n\t.card {\n\t\tbackground-color: ", ";\n\t\twidth: 400px;\n\t\tmargin: 0 auto;\n\t\tpadding: 0 20px;\n\t}\n"])), media_1["default"].lessThan('md')(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n\twidth: 100%;\n\t"], ["\n\twidth: 100%;\n\t"]))), function (props) { return props.theme.colors.vampire; });
var VerticalSpacer = styled_components_1["default"].div(templateObject_3 || (templateObject_3 = __makeTemplateObject(["\n\theight: 2px;\n\tposition: relative;\n\tmargin: 0 auto;\n\t", " {\n\t\tposition: absolute;\n\t\ttransform: translate(-50%, -50%) rotate(90deg);\n\t\tborder: 2px solid ", ";\n\t}\n"], ["\n\theight: 2px;\n\tposition: relative;\n\tmargin: 0 auto;\n\t", " {\n\t\tposition: absolute;\n\t\ttransform: translate(-50%, -50%) rotate(90deg);\n\t\tborder: 2px solid ", ";\n\t}\n"])), common_1.SwapCurrenciesButton, function (props) { return props.theme.colors.black; });
var NoticeText = styled_components_1["default"].div(templateObject_4 || (templateObject_4 = __makeTemplateObject(["\n\tcolor: ", ";\n\ttext-align: center;\n\tpadding: 15px 20px 10px 20px;\n\ttext-align: justify;\n"], ["\n\tcolor: ", ";\n\ttext-align: center;\n\tpadding: 15px 20px 10px 20px;\n\ttext-align: justify;\n"])), function (props) { return props.theme.colors.silver; });
var PoweredBySection = styled_components_1["default"](common_1.FlexDivRowCentered)(templateObject_5 || (templateObject_5 = __makeTemplateObject(["\n\tmargin: 15px auto;\n\ttext-align: center;\n\tcolor: ", ";\n\twidth: 150px;\n"], ["\n\tmargin: 15px auto;\n\ttext-align: center;\n\tcolor: ", ";\n\twidth: 150px;\n"])), function (props) { return props.theme.colors.silver; });
var PaddedImg = styled_components_1["default"](react_optimized_image_1["default"])(templateObject_6 || (templateObject_6 = __makeTemplateObject(["\n\tmargin-left: 8px;\n"], ["\n\tmargin-left: 8px;\n"])));
exports["default"] = BalancerTradeModal;
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6;
