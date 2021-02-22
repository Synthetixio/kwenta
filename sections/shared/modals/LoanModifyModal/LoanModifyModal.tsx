import React, { FC, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled, { css } from 'styled-components';

import media from 'styles/media';

import { FlexDivRowCentered, NoTextTransform, numericValueCSS } from 'styles/common';

import { CenteredModal, MenuModal } from '../common';

import Button from 'components/Button';
import { formatCurrency } from 'utils/formatters/number';
import NumericInput from 'components/Input/NumericInput';

type LoanModifyModalProps = {
	loanIndex: number;
	onDismiss: () => void;
};

export const LoanModifyModal: FC<LoanModifyModalProps> = ({ onDismiss }) => {
	const { t } = useTranslation();

	const [collateralAmount, setCollateralAmount] = useState<string>('');
	const [loanAmount, setLoanAmount] = useState<string>('');

	const quoteCurrencyAmount = '';
	const quoteCurrencyKey = '';

	const baseCurrencyKey = '';
	const baseCurrencyAmount = '';

	const selectedPriceCurrency: any = '';

	const totalTradePrice: any = '';

	return (
		<StyledBaseModal onDismiss={onDismiss} isOpen={true} title={t('modals.loan-modify.title')}>
			<CollateralAmountInput
				value={collateralAmount}
				onChange={(_, value) => setCollateralAmount(value)}
				placeholder={t('common.custom')}
			/>

			<LoanAmountInput
				value={loanAmount}
				onChange={(_, value) => setLoanAmount(value)}
				placeholder={t('common.custom')}
			/>

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
						{formatCurrency(baseCurrencyKey, baseCurrencyAmount)}
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

			<Button variant="primary">{t('common.buttons.update')}</Button>
			<Button variant="secondary">{t('common.buttons.cancel')}</Button>
		</StyledBaseModal>
	);
};

const StyledBaseModal = styled(CenteredModal)`
	[data-reach-dialog-content] {
		width: 200px;
	}
	.card-body {
		max-height: 40vh;
		padding: 24px 0;
		overflow: hidden;
	}
`;

const CollateralAmountInput = styled(NumericInput)``;

const LoanAmountInput = styled(NumericInput)``;

const Summary = styled.div<{ attached?: boolean }>`
	display: grid;
	grid-auto-flow: column;
	flex-grow: 1;
	${media.lessThan('md')`
		grid-auto-flow: unset;
		grid-template-columns: auto auto;
		grid-template-rows: auto auto;
		grid-gap: 20px;
	`}

	${(props) =>
		props.attached &&
		css`
			& {
				grid-template-rows: unset;
			}
		`}
`;

const SummaryItem = styled.div`
	display: grid;
	grid-gap: 4px;
	width: 110px;
	${media.lessThan('md')`
		width: unset;
	`}
`;

const SummaryItemLabel = styled.div`
	text-transform: capitalize;
`;

const SummaryItemValue = styled.div`
	color: ${(props) => props.theme.colors.white};
	${numericValueCSS};
	max-width: 100px;
	overflow: hidden;
	text-overflow: ellipsis;
`;

export default LoanModifyModal;
