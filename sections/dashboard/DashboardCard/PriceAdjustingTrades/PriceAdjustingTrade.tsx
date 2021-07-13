import { FC, useMemo, useEffect } from 'react';
import styled from 'styled-components';
import { Trans, useTranslation } from 'react-i18next';
import Countdown, { zeroPad } from 'react-countdown';
import add from 'date-fns/add';
import { Svg } from 'react-optimized-image';
import BigNumber from 'bignumber.js';

import media from 'styles/media';
import { NoTextTransform } from 'styles/common';
import Currency from 'components/Currency';
import Button from 'components/Button';
import CircleEllipsis from 'assets/svg/app/circle-ellipsis.svg';
import useSelectedPriceCurrency from 'hooks/useSelectedPriceCurrency';
import useSettlementOwing from 'hooks/trades/useSettlementOwing';
import { HistoricalTrade } from 'queries/trades/types';
import useExchangeRatesQuery from 'queries/rates/useExchangeRatesQuery';
import useFeeReclaimPeriodQuery from 'queries/synths/useFeeReclaimPeriodQuery';
import { formatCurrency, toBigNumber } from 'utils/formatters/number';
import { SYNTHS_MAP } from 'constants/currency';

const PriceAdjustingTrade: FC<{ trade: HistoricalTrade }> = ({ trade }) => {
	const { t } = useTranslation();
	const { selectPriceCurrencyRate, selectedPriceCurrency } = useSelectedPriceCurrency();

	const { fromCurrencyKey, toCurrencyKey } = trade;
	// const fee = useSettlementOwing(toCurrencyKey);

	const initialPrice = useMemo(
		() => toBigNumber(trade.toAmountInUSD).div(toBigNumber(trade.toAmount)),
		[trade.toAmountInUSD, trade.toAmount]
	);

	const exchangeRatesQuery = useExchangeRatesQuery();
	const exchangeRates = useMemo(
		() => (exchangeRatesQuery.isSuccess ? exchangeRatesQuery.data ?? null : null),
		[exchangeRatesQuery.isSuccess, exchangeRatesQuery.data]
	);
	const adjustedPrice = useMemo(
		() => (!exchangeRates ? toBigNumber(0) : exchangeRates[toCurrencyKey]),
		[exchangeRates, toCurrencyKey]
	);

	const feeReclaimPeriodSecQuery = useFeeReclaimPeriodQuery(toCurrencyKey);
	const feeReclaimPeriodSec = useMemo(
		() => (feeReclaimPeriodSecQuery.isSuccess ? feeReclaimPeriodSecQuery.data : 0),
		[feeReclaimPeriodSecQuery.isSuccess, feeReclaimPeriodSecQuery.data]
	);
	// const adjustmentEndDate = useMemo(() => add(new Date(), { seconds: feeReclaimPeriodSec }), [
	// 	feeReclaimPeriodSec,
	// ]);
	// const adjustmentEnded = feeReclaimPeriodSec === 0, [feeReclaimPeriodSec]);

	const adjustmentEndDate = useMemo(() => add(new Date(), { seconds: 1000 }), []);
	const fee =
		toCurrencyKey === 'sRUNE'
			? toBigNumber(1.7)
			: toCurrencyKey === 'sBNB'
			? toBigNumber(-18.77)
			: toBigNumber(0);
	const adjustmentEnded = false;

	const hasFee = useMemo(() => !fee.isZero(), [fee]);

	const onSettleClaimFee = () => {};

	// useEffect(() => {
	// 	if (adjustmentEnded) {

	// 	} else {

	// 	}
	// }, [adjustmentEndDate, adjustmentEnded]);

	console.log('fee', fee.toString());

	return adjustmentEnded ? null : (
		<Container>
			<ColorLine />
			<Currency.Icon currencyKey={toCurrencyKey} width="24px" height="24px" />
			<Col>
				<MainColTitle>
					<Trans
						i18nKey="dashboard.price-adjusting-trades.row.main-col-title"
						values={{ fromCurrencyKey, toCurrencyKey }}
						components={[<NoTextTransform />, <NoTextTransform />]}
					/>
				</MainColTitle>
				<MainColSubtitle>
					{t('dashboard.price-adjusting-trades.row.main-col-subtitle')}
				</MainColSubtitle>
			</Col>
			<Col>
				<ColTitle>
					<Currency.Price
						currencyKey={SYNTHS_MAP.sUSD}
						price={initialPrice}
						sign={selectedPriceCurrency.sign}
						conversionRate={selectPriceCurrencyRate}
					/>
				</ColTitle>
				<ColSubtitle>{t('dashboard.price-adjusting-trades.row.col-initial-price')}</ColSubtitle>
			</Col>
			<Col>
				<ColTitle>
					<Currency.Price
						currencyKey={SYNTHS_MAP.sUSD}
						price={adjustedPrice}
						sign={selectedPriceCurrency.sign}
						conversionRate={selectPriceCurrencyRate}
					/>
				</ColTitle>
				<ColSubtitle>{t('dashboard.price-adjusting-trades.row.col-adjusted-price')}</ColSubtitle>
			</Col>
			<Col>
				<ColTitle>
					{hasFee ? (
						<Change value={fee} />
					) : (
						<PendingIcon>
							<Svg src={CircleEllipsis} />
						</PendingIcon>
					)}
				</ColTitle>
				<ColSubtitle>{t('dashboard.price-adjusting-trades.row.col-debt-surplus')}</ColSubtitle>
			</Col>
			<Col>
				{hasFee ? (
					<>
						<ColTitle>
							<Button variant="primary" isRounded={true} onClick={onSettleClaimFee} size="md">
								{fee.isNegative()
									? t('dashboard.price-adjusting-trades.settle-fee')
									: t('dashboard.price-adjusting-trades.claim-fee')}
							</Button>
						</ColTitle>
					</>
				) : (
					<>
						<ColTitle>
							<Countdown
								date={adjustmentEndDate}
								renderer={({ minutes, seconds }) => {
									const duration = [
										`${zeroPad(minutes)}${t('common.time.minutes')}`,
										`${zeroPad(seconds)}${t('common.time.seconds')}`,
									];
									return <span>{duration.join(':')}</span>;
								}}
							/>
						</ColTitle>
						<ColSubtitle>{t('dashboard.price-adjusting-trades.row.col-remaining')}</ColSubtitle>
					</>
				)}
			</Col>
		</Container>
	);
};

const Change: FC<{ value: BigNumber }> = ({ value }) => {
	const { selectedPriceCurrency } = useSelectedPriceCurrency();
	return (
		<CurrencyChange isPositive={!value.isNegative()}>
			{formatCurrency(SYNTHS_MAP.sUSD, value.toString(), {
				sign: selectedPriceCurrency.sign,
			})}
		</CurrencyChange>
	);
};

const CurrencyChange = styled.span<{ isPositive: boolean }>`
	display: inline-flex;
	align-items: center;
	color: ${(props) => (props.isPositive ? props.theme.colors.green : props.theme.colors.red)};
	font-family: ${(props) => props.theme.fonts.mono};
`;

const Container = styled.div`
	background: ${(props) => props.theme.colors.elderberry};
	padding: 12px 16px;
	margin-top: 2px;
	display: grid;
	align-items: center;
	grid-gap: 14px;
	grid-template-columns: 4px 24px 2fr 1fr 1fr 1fr 1fr;
	${media.lessThan('md')`
		grid-template-columns: auto auto;
	`}
`;

const ColorLine = styled.div`
	width: 4px;
	height: 40px;
	background: ${(props) => props.theme.colors.yellow};
`;

const Col = styled.div`
	display: flex;
	flex-direction: column;
	justify-content: space-between;
`;

const ColTitle = styled.div`
	color: ${(props) => props.theme.colors.white};
	font-family: ${(props) => props.theme.fonts.mono};
`;

const ColSubtitle = styled.div`
	font-family: ${(props) => props.theme.fonts.bold};
`;

const MainColTitle = styled(ColTitle)`
	font-family: ${(props) => props.theme.fonts.bold};
	font-size: 14px;
`;

const MainColSubtitle = styled(ColSubtitle)``;

const PendingIcon = styled.div`
	color: ${(props) => props.theme.colors.yellow};
`;

export default PriceAdjustingTrade;
