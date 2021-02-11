import { FC } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import styled from 'styled-components';
import Img, { Svg } from 'react-optimized-image';
import BigNumber from 'bignumber.js';
import {
	FlexDivRowCentered,
	numericValueCSS,
	NoTextTransform,
	FlexDivColCentered,
	Tooltip,
} from 'styles/common';

import { CurrencyKey } from 'constants/currency';

import BaseModal from 'components/BaseModal';
import Currency from 'components/Currency';

import ArrowsIcon from 'assets/svg/app/circle-arrows.svg';

import OneInchImage from 'assets/svg/providers/1inch.svg';

import {
	formatCurrency,
	LONG_CRYPTO_CURRENCY_DECIMALS,
	toBigNumber,
} from 'utils/formatters/number';
import { MessageButton } from 'sections/exchange/FooterCard/common';
import useSelectedPriceCurrency from 'hooks/useSelectedPriceCurrency';
import { ESTIMATE_VALUE } from 'constants/placeholder';

type TxConfirmationModalProps = {
	onDismiss: () => void;
	txError: boolean;
	attemptRetry: () => void;
	baseCurrencyKey: CurrencyKey;
	baseCurrencyAmount: string;
	quoteCurrencyKey: CurrencyKey;
	quoteCurrencyAmount: string;
	totalTradePrice: string;
	feeAmountInBaseCurrency: BigNumber | null;
	txProvider: 'synthetix' | '1inch' | 'balancer';
};

export const TxConfirmationModal: FC<TxConfirmationModalProps> = ({
	onDismiss,
	txError,
	attemptRetry,
	baseCurrencyKey,
	quoteCurrencyKey,
	baseCurrencyAmount,
	quoteCurrencyAmount,
	totalTradePrice,
	feeAmountInBaseCurrency,
	txProvider,
}) => {
	const { t } = useTranslation();
	const { selectedPriceCurrency } = useSelectedPriceCurrency();

	const getBaseCurrencyAmount = (decimals?: number) =>
		formatCurrency(
			baseCurrencyKey,
			feeAmountInBaseCurrency != null
				? toBigNumber(baseCurrencyAmount).minus(feeAmountInBaseCurrency)
				: baseCurrencyAmount,
			{
				minDecimals: decimals,
			}
		);

	return (
		<StyledBaseModal
			onDismiss={onDismiss}
			isOpen={true}
			title={t('modals.confirm-transaction.title')}
		>
			<Currencies>
				<CurrencyItem>
					<CurrencyItemTitle>{t('exchange.common.from')}</CurrencyItemTitle>
					<Currency.Icon
						currencyKey={quoteCurrencyKey}
						width="40px"
						height="40px"
						data-testid="quote-currency-img"
					/>
				</CurrencyItem>
				<ArrowsIconContainer>
					<Svg src={ArrowsIcon} />
				</ArrowsIconContainer>
				<CurrencyItem>
					<CurrencyItemTitle>{t('exchange.common.into')}</CurrencyItemTitle>
					<Currency.Icon
						currencyKey={baseCurrencyKey}
						width="40px"
						height="40px"
						data-testid="base-currency-img"
					/>
				</CurrencyItem>
			</Currencies>
			<Subtitle>{t('modals.confirm-transaction.confirm-with-provider')}</Subtitle>
			<Summary>
				<SummaryItem>
					<SummaryItemLabel data-testid="quote-currency-label">
						<Trans
							i18nKey="common.currency.currency-amount"
							values={{ currencyKey: quoteCurrencyKey }}
							components={[<NoTextTransform />]}
						/>
					</SummaryItemLabel>
					<SummaryItemValue data-testid="quote-currency-value">
						{formatCurrency(quoteCurrencyKey, quoteCurrencyAmount)}
					</SummaryItemValue>
				</SummaryItem>
				<SummaryItem>
					<SummaryItemLabel data-testid="base-currency-label">
						<Trans
							i18nKey="common.currency.currency-amount"
							values={{ currencyKey: baseCurrencyKey }}
							components={[<NoTextTransform />]}
						/>
					</SummaryItemLabel>
					<SummaryItemValue data-testid="base-currency-value">
						<StyledTooltip
							placement="right"
							content={<span>{getBaseCurrencyAmount(LONG_CRYPTO_CURRENCY_DECIMALS)}</span>}
							arrow={false}
						>
							<span>
								{ESTIMATE_VALUE} {getBaseCurrencyAmount()}
							</span>
						</StyledTooltip>
					</SummaryItemValue>
				</SummaryItem>
				<SummaryItem>
					<SummaryItemLabel data-testid="total-trade-price-label">
						<Trans
							i18nKey="common.currency.estimated-currency-value"
							values={{ currencyKey: selectedPriceCurrency.asset }}
							components={[<NoTextTransform />]}
						/>
					</SummaryItemLabel>
					<SummaryItemValue data-testid="total-trade-price-value">
						{formatCurrency(selectedPriceCurrency.name, totalTradePrice, {
							sign: selectedPriceCurrency.sign,
						})}
					</SummaryItemValue>
				</SummaryItem>
			</Summary>
			{txProvider === '1inch' && (
				<TxProvider>
					<span>{t('common.powered-by')}</span>
					<Img
						src={OneInchImage}
						width="40"
						height="40"
						alt={t('common.dex-aggregators.1inch.title')}
					/>
				</TxProvider>
			)}
			{txError && (
				<Actions>
					<Message>{t('common.transaction.error')}</Message>
					<MessageButton onClick={attemptRetry} data-testid="retry-btn">
						{t('common.transaction.reattempt')}
					</MessageButton>
				</Actions>
			)}
		</StyledBaseModal>
	);
};

const StyledBaseModal = styled(BaseModal)`
	[data-reach-dialog-content] {
		width: 270px;
	}
	.card-body {
		padding: 24px;
	}
`;

const Currencies = styled.div`
	display: grid;
	grid-gap: 24px;
	padding-bottom: 24px;
	justify-content: center;
	grid-auto-flow: column;
	align-items: flex-end;
`;

const CurrencyItem = styled.div`
	text-align: center;
	color: ${(props) => props.theme.colors.white};
`;

const CurrencyItemTitle = styled.div`
	padding-bottom: 8px;
	text-transform: capitalize;
`;

const ArrowsIconContainer = styled.div`
	color: ${(props) => props.theme.colors.goldColors.color1};
	padding-bottom: 2px;
`;

const Subtitle = styled.div`
	text-align: center;
	color: ${(props) => props.theme.colors.silver};
	padding-bottom: 48px;
`;

const Summary = styled.div``;

const SummaryItem = styled(FlexDivRowCentered)`
	margin-bottom: 8px;
	padding-bottom: 8px;
	border-bottom: 1px solid ${(props) => props.theme.colors.navy};
`;

const SummaryItemLabel = styled.div``;

const SummaryItemValue = styled.div`
	color: ${(props) => props.theme.colors.white};
	${numericValueCSS};
`;

const Actions = styled(FlexDivColCentered)`
	margin: 8px 0px;
`;

const Message = styled.div`
	color: ${(props) => props.theme.colors.white};
	font-size: 14px;
	font-family: ${(props) => props.theme.fonts.bold};
	flex-grow: 1;
	text-align: center;
	margin: 16px 0px;
`;

const TxProvider = styled.div`
	padding-top: 32px;
	text-align: center;
	img {
		vertical-align: middle;
		margin-left: 10px;
	}
`;

const StyledTooltip = styled(Tooltip)`
	.tippy-content {
		padding: 5px;
		font-family: ${(props) => props.theme.fonts.mono};
		font-size: 12px;
	}
`;

export default TxConfirmationModal;
