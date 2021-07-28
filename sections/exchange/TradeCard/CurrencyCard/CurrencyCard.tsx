import { FC, MouseEvent, ReactNode, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import styled, { css } from 'styled-components';
import { Svg } from 'react-optimized-image';

import { CurrencyKey } from 'constants/currency';
import { NO_VALUE } from 'constants/placeholder';

import CaretDownIcon from 'assets/svg/app/caret-down.svg';

import { formatCurrency, formatPercent, zeroBN } from 'utils/formatters/number';

import Card from 'components/Card';
import NumericInput from 'components/Input/NumericInput';
import Loader from 'components/Loader';

import { FlexDivRowCentered, numericValueCSS, CapitalizedText } from 'styles/common';

import { Side } from '../types';
import useSelectedPriceCurrency from 'hooks/useSelectedPriceCurrency';
import { TxProvider } from 'sections/shared/modals/TxConfirmationModal/TxConfirmationModal';
import Wei, { wei } from '@synthetixio/wei';

type CurrencyCardProps = {
	side: Side;
	currencyKey: string | null;
	amount: string;
	onAmountChange: (value: string) => void;
	walletBalance: Wei | null;
	onBalanceClick: () => void;
	onCurrencySelect?: () => void;
	priceRate: Wei | number | string | null;
	className?: string;
	label: ReactNode;
	interactive?: boolean;
	disableInput?: boolean;
	slippagePercent?: Wei | null;
	isLoading?: boolean;
	txProvider?: TxProvider;
};

const CurrencyCard: FC<CurrencyCardProps> = ({
	side,
	currencyKey,
	amount,
	slippagePercent,
	onAmountChange,
	walletBalance,
	onBalanceClick,
	onCurrencySelect,
	priceRate,
	label,
	interactive = true,
	disableInput = false,
	isLoading = false,
	txProvider = 'synthetix',
	...rest
}) => {
	const { t } = useTranslation();
	const {
		selectPriceCurrencyRate,
		selectedPriceCurrency,
		getPriceAtCurrentRate,
	} = useSelectedPriceCurrency();

	const isBase = useMemo(() => side === 'base', [side]);

	const hasWalletBalance = useMemo(() => walletBalance != null && currencyKey != null, [
		walletBalance,
		currencyKey,
	]);
	const amountBN = useMemo(() => (amount === '' ? zeroBN : wei(amount)), [amount]);

	const insufficientBalance = !isBase && hasWalletBalance ? amountBN.gt(walletBalance!) : false;

	let tradeAmount = priceRate ? amountBN.mul(priceRate) : null;
	if (selectPriceCurrencyRate != null && tradeAmount != null) {
		tradeAmount = getPriceAtCurrentRate(tradeAmount);
	}

	const currencyKeySelected = currencyKey != null;
	const hasCurrencySelectCallback = onCurrencySelect != null;

	return (
		<StyledCard
			className={`currency-card currency-card-${side}`}
			interactive={interactive}
			{...rest}
		>
			<StyledCardBody className="currency-card-body">
				<LabelContainer data-testid="destination">{label}</LabelContainer>
				<CurrencyWalletBalanceContainer className="currency-wallet-container">
					<CurrencyContainer className="currency-container">
						<CurrencySelector
							currencyKeySelected={currencyKeySelected}
							onClick={hasCurrencySelectCallback ? onCurrencySelect : undefined}
							role="button"
							data-testid="currency-selector"
						>
							{currencyKey ?? (
								<CapitalizedText>
									{txProvider === '1inch'
										? t('exchange.currency-card.currency-selector.select-token')
										: t('exchange.currency-card.currency-selector.select-synth')}
								</CapitalizedText>
							)}{' '}
							{hasCurrencySelectCallback && <Svg src={CaretDownIcon} />}
						</CurrencySelector>
						{currencyKeySelected && (
							<CurrencyAmountContainer
								className="currency-amount-container"
								disableInput={disableInput}
							>
								<CurrencyAmount
									value={amount}
									onChange={(_, value) => onAmountChange(value)}
									placeholder="0"
									data-testid="currency-amount"
								/>
								<FlexDivRowCentered>
									<CurrencyAmountValue data-testid="amount-value">
										{tradeAmount != null
											? formatCurrency(selectedPriceCurrency.name as CurrencyKey, tradeAmount, {
													sign: selectedPriceCurrency.sign,
											  })
											: null}
									</CurrencyAmountValue>
									<Slippage>
										{!isLoading &&
											slippagePercent != null &&
											slippagePercent.lt(0) &&
											formatPercent(slippagePercent)}
									</Slippage>
								</FlexDivRowCentered>
								{isLoading && <StyledLoader width="24px" height="24px" />}
							</CurrencyAmountContainer>
						)}
					</CurrencyContainer>
					<WalletBalanceContainer disableInput={disableInput}>
						<WalletBalanceLabel>{t('exchange.currency-card.wallet-balance')}</WalletBalanceLabel>
						<WalletBalance
							onClick={hasWalletBalance ? onBalanceClick : undefined}
							insufficientBalance={insufficientBalance}
							data-testid="wallet-balance"
						>
							{/* @ts-ignore */}
							{hasWalletBalance ? formatCurrency(currencyKey, walletBalance) : NO_VALUE}
						</WalletBalance>
					</WalletBalanceContainer>
				</CurrencyWalletBalanceContainer>
			</StyledCardBody>
		</StyledCard>
	);
};

const StyledCard = styled(Card)<{ interactive?: boolean }>`
	${(props) =>
		!props.interactive &&
		css`
			pointer-events: none;
		`}
`;

const StyledCardBody = styled(Card.Body)`
	padding: 11px 30px;
`;

const LabelContainer = styled.div`
	padding-bottom: 2px;
	text-transform: capitalize;
`;

const CurrencyWalletBalanceContainer = styled.div``;

const CurrencyContainer = styled(FlexDivRowCentered)`
	padding-bottom: 6px;
`;

const CurrencySelector = styled.div<{
	currencyKeySelected: boolean;
	onClick: ((event: MouseEvent<HTMLDivElement, MouseEvent>) => void) | undefined;
	interactive?: boolean;
}>`
	display: grid;
	align-items: center;
	grid-auto-flow: column;
	grid-gap: 9px;
	margin-right: 20px;
	font-size: 16px;
	padding: 4px 10px;
	margin-left: -10px;
	font-family: ${(props) => props.theme.fonts.bold};
	color: ${(props) => props.theme.colors.white};
	svg {
		color: ${(props) => props.theme.colors.goldColors.color1};
	}

	${(props) =>
		!props.currencyKeySelected &&
		css`
			margin: 12px 6px 12px -10px;
		`};

	${(props) =>
		props.onClick &&
		css`
			&:hover {
				background-color: ${(props) => props.theme.colors.black};
				border-radius: 100px;
				cursor: pointer;
			}
		`};
`;

const CurrencyAmountContainer = styled.div<{ disableInput?: boolean }>`
	background-color: ${(props) => props.theme.colors.black};
	border-radius: 4px;
	width: 100%;
	position: relative;
	${(props) =>
		props.disableInput &&
		css`
			pointer-events: none;
		`}
`;

const CurrencyAmount = styled(NumericInput)`
	font-size: 16px;
	border: 0;
	height: 30px;
`;

const CurrencyAmountValue = styled.div`
	${numericValueCSS};
	padding: 0px 8px 2px 8px;
	font-size: 10px;
	width: 150px;
	overflow: hidden;
	text-overflow: ellipsis;
`;

const Slippage = styled.div`
	${numericValueCSS};
	padding: 0px 8px 2px 8px;
	font-size: 11px;
	color: ${(props) => props.theme.colors.yellow};
`;

const WalletBalanceContainer = styled(FlexDivRowCentered)<{ disableInput?: boolean }>`
	${(props) =>
		props.disableInput &&
		css`
			pointer-events: none;
		`}
`;

const WalletBalanceLabel = styled.div`
	text-transform: capitalize;
	font-family: ${(props) => props.theme.fonts.bold};
`;

const WalletBalance = styled.div<{ insufficientBalance: boolean }>`
	${numericValueCSS};
	cursor: ${(props) => (props.onClick ? 'pointer' : 'default')};
	${(props) =>
		props.insufficientBalance &&
		css`
			color: ${props.theme.colors.red};
		`}
`;

const StyledLoader = styled(Loader)`
	left: 90%;
`;

export default CurrencyCard;
