import { FC, useMemo, useState } from 'react';
import styled, { css } from 'styled-components';
import { useTranslation } from 'react-i18next';
import { useRecoilState } from 'recoil';
import { Svg } from 'react-optimized-image';

import { DesktopOnlyView, MobileOrTabletView } from 'components/Media';
import {} from 'styles/common';
import Card from 'components/Card';
import Button from 'components/Button';
import { getTransactionPrice } from 'utils/network';
import { getExchangeRatesForCurrencies } from 'utils/currencies';
import InfoIcon from 'assets/svg/app/info.svg';

import { GAS_SPEEDS } from 'queries/network/useEthGasPriceQuery';
import { FixedFooterMixin, GridDivCentered, NumericValue } from 'styles/common';
import media from 'styles/media';
import { gasSpeedState, customGasPriceState } from 'store/wallet';
import useSelectedPriceCurrency from 'hooks/useSelectedPriceCurrency';
import { formatCurrency } from 'utils/formatters/number';
import useEthGasPriceQuery from 'queries/network/useEthGasPriceQuery';
import { SYNTHS_MAP } from 'constants/currency';
import useExchangeRatesQuery from 'queries/rates/useExchangeRatesQuery';
import useCollateralShortDataQuery from 'queries/collateral/useCollateralShortDataQuery';
import { CurrencyKey } from 'constants/currency';
import { NO_VALUE, ESTIMATE_VALUE } from 'constants/placeholder';

import {
	SummaryItems,
	SummaryItem,
	SummaryItemLabel,
	SummaryItemValue,
	GasPriceCostTooltip,
	GasPriceItem,
	GasPriceTooltip,
	StyledGasButton,
	CustomGasPrice,
	GasSelectContainer,
	CustomGasPriceContainer,
	ErrorTooltip,
	MobileCard,
	SubmissionDisabledReason,
	StyledGasEditButton,
} from 'sections/exchange/FooterCard/TradeSummaryCard';

interface ShortingRewardsProps {
	synth: CurrencyKey;
}

const ShortingRewards: FC<ShortingRewardsProps> = ({ synth }) => {
	const { t } = useTranslation();
	const [gasSpeed, setGasSpeed] = useRecoilState(gasSpeedState);
	const [customGasPrice, setCustomGasPrice] = useRecoilState(customGasPriceState);
	const { selectedPriceCurrency } = useSelectedPriceCurrency();
	const ethGasPriceQuery = useEthGasPriceQuery();
	const exchangeRatesQuery = useExchangeRatesQuery();
	const collateralShortDataQuery = useCollateralShortDataQuery(synth);
	const shortingRewards = collateralShortDataQuery.isSuccess
		? collateralShortDataQuery?.data?.shortingRewards ?? null
		: null;

	const [gasLimit, setGasLimit] = useState<number | null>(null);

	const submissionDisabledReason: SubmissionDisabledReason | null = useMemo(() => {
		if (shortingRewards == null || shortingRewards.lte(0)) {
			return 'insufficient-balance';
		}
		return null;
	}, [shortingRewards]);

	const isSubmissionDisabled = useMemo(() => (submissionDisabledReason != null ? true : false), [
		submissionDisabledReason,
	]);

	const gasPrices = useMemo(() => ethGasPriceQuery?.data ?? null, [ethGasPriceQuery.data]);

	const hasCustomGasPrice = customGasPrice !== '';
	const gasPrice = ethGasPriceQuery?.data != null ? ethGasPriceQuery.data[gasSpeed] : null;
	const exchangeRates = exchangeRatesQuery.isSuccess ? exchangeRatesQuery.data ?? null : null;

	const ethPriceRate = useMemo(
		() => getExchangeRatesForCurrencies(exchangeRates, SYNTHS_MAP.sETH, selectedPriceCurrency.name),
		[exchangeRates, selectedPriceCurrency.name]
	);

	const transactionFee = useMemo(() => getTransactionPrice(gasPrice, gasLimit, ethPriceRate), [
		gasPrice,
		gasLimit,
		ethPriceRate,
	]);

	const gasPriceItem = hasCustomGasPrice ? (
		<span data-testid="gas-price">{Number(customGasPrice)}</span>
	) : (
		<span data-testid="gas-price">
			{ESTIMATE_VALUE} {gasPrice}
		</span>
	);

	const onSubmit = () => {
		console.log('submitting');
	};

	const summaryItems = (
		<SummaryItems attached={false}>
			<SummaryItem>
				<SummaryItemLabel>{t('exchange.summary-info.gas-price-gwei')}</SummaryItemLabel>
				<SummaryItemValue>
					{gasPrice != null ? (
						<>
							{transactionFee != null ? (
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
							) : (
								gasPriceItem
							)}
							<GasPriceTooltip
								trigger="click"
								arrow={false}
								content={
									<GasSelectContainer>
										<CustomGasPriceContainer>
											<CustomGasPrice
												value={customGasPrice}
												onChange={(_, value) => setCustomGasPrice(value)}
												placeholder={t('common.custom')}
											/>
										</CustomGasPriceContainer>
										{GAS_SPEEDS.map((speed) => (
											<StyledGasButton
												key={speed}
												variant="select"
												onClick={() => {
													setCustomGasPrice('');
													setGasSpeed(speed);
												}}
												isActive={hasCustomGasPrice ? false : gasSpeed === speed}
											>
												<span>{t(`common.gas-prices.${speed}`)}</span>
												<NumericValue>{gasPrices![speed]}</NumericValue>
											</StyledGasButton>
										))}
									</GasSelectContainer>
								}
								interactive={true}
							>
								<StyledGasEditButton role="button">{t('common.edit')}</StyledGasEditButton>
							</GasPriceTooltip>
						</>
					) : (
						NO_VALUE
					)}
				</SummaryItemValue>
			</SummaryItem>
		</SummaryItems>
	);

	return (
		<>
			<MobileOrTabletView>
				<MobileCard className="trade-summary-card">
					<Card.Body>{summaryItems}</Card.Body>
				</MobileCard>
			</MobileOrTabletView>
			<MessageContainer attached={false} className="footer-card">
				<DesktopOnlyView>{summaryItems}</DesktopOnlyView>
				<Button
					variant="primary"
					isRounded={true}
					disabled={isSubmissionDisabled}
					onClick={onSubmit}
					size="lg"
					data-testid="submit-order"
				>
					{isSubmissionDisabled
						? t(`exchange.summary-info.button.${submissionDisabledReason}`)
						: t('exchange.summary-info.button.submit-order')}
				</Button>
			</MessageContainer>
		</>
	);
};

export const MessageContainer = styled(GridDivCentered)<{ attached?: boolean }>`
	width: 45%;
	margin-top: 50px;
	border-radius: 4px;
	grid-template-columns: 1fr auto;
	background-color: ${(props) => props.theme.colors.elderberry};
	padding: 16px 32px;
	max-width: 750px;
	margin: 0 auto;
	${(props) =>
		props.attached &&
		css`
			border-radius: 4px;
		`}
	${media.lessThan('md')`
		${FixedFooterMixin};
		box-shadow: 0 -8px 8px 0 ${(props) => props.theme.colors.black};
		justify-content: center;
		display: flex;
	`}
`;

export default ShortingRewards;
