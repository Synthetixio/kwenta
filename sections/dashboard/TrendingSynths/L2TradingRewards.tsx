import { FC, useMemo, useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { Svg } from 'react-optimized-image';
import { useRecoilValue } from 'recoil';
import Tippy from '@tippyjs/react';

import useSelectedPriceCurrency from 'hooks/useSelectedPriceCurrency';

import { CRYPTO_CURRENCY_MAP, SYNTHS_MAP } from 'constants/currency';
import { NO_VALUE, ESTIMATE_VALUE } from 'constants/placeholder';

import Button from 'components/Button';

import InfoIcon from 'assets/svg/app/info.svg';

import { CardTitle } from 'sections/dashboard/common';

import { FlexDivCol, FlexDivRowCentered, numericValueCSS } from 'styles/common';

import useAvailableL2TradingRewardsQuery from 'queries/trades/useAvailableL2TradingRewardsQuery';
import useEthGasPriceQuery from 'queries/network/useEthGasPriceQuery';
import useExchangeRatesQuery from 'queries/rates/useExchangeRatesQuery';

import { formatCryptoCurrency, formatCurrency, zeroBN } from 'utils/formatters/number';
import { getExchangeRatesForCurrencies } from 'utils/currencies';
import { getTransactionPrice } from 'utils/network';

import { gasSpeedState } from 'store/wallet';

const L2TradingRewards: FC = () => {
	const { t } = useTranslation();

	const { selectedPriceCurrency } = useSelectedPriceCurrency();

	const ethGasPriceQuery = useEthGasPriceQuery();
	const exchangeRatesQuery = useExchangeRatesQuery();

	const exchangeRates = exchangeRatesQuery.isSuccess ? exchangeRatesQuery.data ?? null : null;
	const gasPrices = ethGasPriceQuery.data;
	const [gasLimit] = useState<number | null>(null);
	const ethPriceRate = useMemo(
		() => getExchangeRatesForCurrencies(exchangeRates, SYNTHS_MAP.sETH, selectedPriceCurrency.name),
		[exchangeRates, selectedPriceCurrency.name]
	);
	const gasSpeed = useRecoilValue(gasSpeedState);
	const gasPrice = gasPrices ? gasPrices[gasSpeed] : null;
	const transactionFee = useMemo(() => getTransactionPrice(gasPrice, gasLimit, ethPriceRate), [
		gasPrice,
		gasLimit,
		ethPriceRate,
	]);

	const rewardsQuery = useAvailableL2TradingRewardsQuery();
	const rewards = rewardsQuery.data ?? zeroBN;
	const canClaimRewards = !rewards.isZero();
	const onClaimRewards = () => {};

	const gasPriceItem = (
		<span data-testid="gas-price">
			{ESTIMATE_VALUE} {gasPrice}
		</span>
	);

	return (
		<Container>
			<Heading>
				{t('l2-trading-incentives.dashboard.title')} <Svg src={InfoIcon} />
			</Heading>

			<RewardsCard>
				<FlexDivCol>
					<Title>{t('l2-trading-incentives.dashboard.potential-rewards')}</Title>
					<Amount>200 SNX</Amount>
				</FlexDivCol>
			</RewardsCard>

			<RewardsCard>
				<FlexDivCol>
					<Title>{t('l2-trading-incentives.dashboard.claimable-rewards')}</Title>
					<Amount>
						{formatCryptoCurrency(rewards, {
							currencyKey: CRYPTO_CURRENCY_MAP.SNX,
						})}
					</Amount>
				</FlexDivCol>

				<ClaimRewardsButton
					variant="primary"
					isRounded={true}
					disabled={!canClaimRewards}
					onClick={onClaimRewards}
					size="lg"
					data-testid="submit-order"
				>
					{t('l2-trading-incentives.dashboard.claim')}
				</ClaimRewardsButton>
			</RewardsCard>

			<LineItem>
				<LineItemLabel>{t('l2-trading-incentives.dashboard.epoch')}</LineItemLabel>
				<LineItemValue>07:14:55</LineItemValue>
			</LineItem>
			<LineItem>
				<LineItemLabel>{t('exchange.summary-info.gas-price-gwei')}</LineItemLabel>
				<LineItemValue>
					{gasPrice == null ? (
						NO_VALUE
					) : transactionFee == null ? (
						gasPriceItem
					) : (
						<GasPriceCostTooltip
							content={
								<span>
									{formatCurrency(selectedPriceCurrency.name, transactionFee, {
										sign: selectedPriceCurrency.sign,
									})}
								</span>
							}
							arrow={false}
						>
							<GasPriceItem>
								{gasPriceItem}
								<Svg src={InfoIcon} />
							</GasPriceItem>
						</GasPriceCostTooltip>
					)}
				</LineItemValue>
			</LineItem>
		</Container>
	);
};

export default L2TradingRewards;

const Container = styled.div`
	margin-bottom: 16px;
`;

const RewardsCard = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 9px 16px;
	background: ${(props) => props.theme.colors.navy};
	border-radius: 4px;
	margin: 8px 0;
`;

const Title = styled.div`
	font-size: 12px;
	color: ${(props) => props.theme.colors.silver};
`;

const Amount = styled.div`
	font-size: 16px;
	font-family: ${(props) => props.theme.fonts.bold};
	color: ${(props) => props.theme.colors.white};
`;

const Heading = styled(CardTitle)`
	display: flex;
	align-items: center;
	grid-gap: 5px;
`;

const ClaimRewardsButton = styled(Button)`
	width: 64px;
	height: 24px;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 0;
	font-size: 12px;
`;

const LineItem = styled(FlexDivRowCentered)`
	border-bottom: 0.5px solid ${(props) => props.theme.colors.navy};
	height: 40px;
`;

const LineItemLabel = styled.div`
	text-transform: capitalize;
	color: ${(props) => props.theme.colors.blueberry};
`;

const LineItemValue = styled.div`
	color: ${(props) => props.theme.colors.white};
	${numericValueCSS};
`;

export const GasPriceTooltip = styled(Tippy)`
	background: ${(props) => props.theme.colors.elderberry};
	border: 0.5px solid ${(props) => props.theme.colors.navy};
	border-radius: 4px;
	width: 120px;
	.tippy-content {
		padding: 0;
	}
`;

export const GasPriceCostTooltip = styled(GasPriceTooltip)`
	width: auto;
	font-size: 12px;
	.tippy-content {
		padding: 5px;
		font-family: ${(props) => props.theme.fonts.mono};
	}
`;

export const GasPriceItem = styled.span`
	display: inline-flex;
	align-items: center;
	cursor: pointer;
	svg {
		margin-left: 5px;
	}
`;
