import { FC } from 'react';

const PriceAdjustmentOnNextTrade: FC = () => null;
export default PriceAdjustmentOnNextTrade;

// import styled from 'styled-components';
// import { Trans, useTranslation } from 'react-i18next';
// import { Svg } from 'react-optimized-image';

// import Currency from 'components/Currency';
// import { SYNTHS_MAP } from 'constants/currency';
// import useSelectedPriceCurrency from 'hooks/useSelectedPriceCurrency';
// import useSettlementOwing from 'hooks/trades/useSettlementOwing';
// import InfoIcon from 'assets/svg/app/info.svg';
// import { Tooltip } from 'styles/common';

// const PriceAdjustmentOnNextTrade: FC = () => {
// 	const { t } = useTranslation();
// 	const { selectPriceCurrencyRate, selectedPriceCurrency } = useSelectedPriceCurrency();
// 	const priceAdjustmentFee = useSettlementOwing(SYNTHS_MAP.sUSD);

// 	// priceAdjustmentFee.isZero() ? null :
// 	return (
// 		<Container>
// 			<div>
// 				<span>{t('dashboard.price-adjustment-on-next-trade.label')}</span>
// 				<TooltipContainer
// 					placement="top"
// 					content={
// 						<Trans
// 							i18nKey="dashboard.price-adjustment-on-next-trade.value-hint"
// 							values={{}}
// 							components={[]}
// 						/>
// 					}
// 					arrow={false}
// 					interactive={true}
// 				>
// 					<TooltipAnchor>
// 						<Svg src={InfoIcon} />
// 					</TooltipAnchor>
// 				</TooltipContainer>
// 			</div>

// 			<Currency.Price
// 				currencyKey={SYNTHS_MAP.sUSD}
// 				price={priceAdjustmentFee.toString()}
// 				sign={selectedPriceCurrency.sign}
// 				conversionRate={selectPriceCurrencyRate}
// 			/>
// 		</Container>
// 	);
// };

// const Container = styled.div`
// 	margin: 16px 0;
// 	padding: 12px 16px;
// 	border-radius: 4px;
// 	background-color: ${(props) => props.theme.colors.elderberry};
// 	display: flex;
// 	justify-content: space-between;
// 	align-items: center;
// 	font-size: 12px;
// 	color: ${(props) => props.theme.colors.white};
// 	font-family: ${(props) => props.theme.fonts.bold};
// `;

// const TooltipContainer = styled(Tooltip)`
// 	.tippy-content {
// 		padding: 5px;
// 		font-family: ${(props) => props.theme.fonts.mono};
// 		font-size: 12px;
// 	}
// `;

// export const TooltipAnchor = styled.span`
// 	display: inline-flex;
// 	align-items: center;
// 	cursor: pointer;
// 	svg {
// 		margin-left: 5px;
// 		transform: translateY(2px);
// 	}
// `;

// export default PriceAdjustmentOnNextTrade;
