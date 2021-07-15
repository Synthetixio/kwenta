import { FC, useMemo, useEffect } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import Countdown, { zeroPad } from 'react-countdown';
import add from 'date-fns/add';
import { Svg } from 'react-optimized-image';
import BigNumber from 'bignumber.js';

import media from 'styles/media';
import Currency from 'components/Currency';
import Button from 'components/Button';
import CircleEllipsis from 'assets/svg/app/circle-ellipsis.svg';
import useSelectedPriceCurrency from 'hooks/useSelectedPriceCurrency';
import useSettlementOwing from 'hooks/trades/useSettlementOwing';
import useFeeReclaimPeriodQuery from 'queries/synths/useFeeReclaimPeriodQuery';
import { formatCurrency, toBigNumber } from 'utils/formatters/number';
import { SYNTHS_MAP, CurrencyKey } from 'constants/currency';

const FeeReclaimingSynth: FC<{ currencyKey: CurrencyKey }> = ({ currencyKey }) => {
	const { t } = useTranslation();

	const feeReclaimPeriodSecQuery = useFeeReclaimPeriodQuery(currencyKey);
	const feeReclaimPeriodSec = useMemo(
		() => (feeReclaimPeriodSecQuery.isSuccess ? feeReclaimPeriodSecQuery.data : 0),
		[feeReclaimPeriodSecQuery.isSuccess, feeReclaimPeriodSecQuery.data]
	);

	const adjustmentEndDate = useMemo(() => add(new Date(), { seconds: feeReclaimPeriodSec }), [
		feeReclaimPeriodSec,
	]);
	const adjustmentEnded = useMemo(() => feeReclaimPeriodSec === 0, [feeReclaimPeriodSec]);

	const { fee, numEntries } = useSettlementOwing(currencyKey);

	// const adjustmentEndDate = useMemo(() => add(new Date(), { seconds: 1000 }), []);
	// const fee =
	// 	currencyKey === 'sRUNE'
	// 		? toBigNumber(1.7)
	// 		: currencyKey === 'sBTC'
	// 		? toBigNumber(-18.77)
	// 		: toBigNumber(0);
	// const adjustmentEnded = false;

	const hasFee = useMemo(() => !fee.isZero(), [fee]);

	const onSettleFee = () => {};

	// useEffect(() => {
	// 	if (adjustmentEnded) {

	// 	} else {

	// 	}
	// }, [adjustmentEndDate, adjustmentEnded]);

	return adjustmentEnded ? null : (
		<Container>
			<ColorLine />
			<Currency.Icon currencyKey={currencyKey} width="24px" height="24px" />
			<Col>
				<MainColTitle>{currencyKey}</MainColTitle>
				<MainColSubtitle>
					{hasFee
						? t('dashboard.fee-reclaiming-synths.row.main-col-complete-subtitle')
						: t('dashboard.fee-reclaiming-synths.row.main-col-subtitle')}
				</MainColSubtitle>
			</Col>
			<Col>
				<ColTitle>{numEntries.toString()}</ColTitle>
				<ColSubtitle>{t('dashboard.fee-reclaiming-synths.row.col-trades')}</ColSubtitle>
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
				<ColSubtitle>{t('dashboard.fee-reclaiming-synths.row.col-debt-surplus')}</ColSubtitle>
			</Col>
			<Col>
				{hasFee ? (
					<>
						<ColTitle>
							<Button variant="primary" isRounded={true} onClick={onSettleFee} size="md">
								{t('dashboard.fee-reclaiming-synths.settle-fee')}
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
						<ColSubtitle>{t('dashboard.fee-reclaiming-synths.row.col-remaining')}</ColSubtitle>
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
	text-align: center;
`;

const ColSubtitle = styled.div`
	font-family: ${(props) => props.theme.fonts.bold};
	text-align: center;
`;

const MainColTitle = styled(ColTitle)`
	font-family: ${(props) => props.theme.fonts.bold};
	font-size: 14px;
	text-align: left;
`;

const MainColSubtitle = styled(ColSubtitle)`
	text-align: left;
`;

const PendingIcon = styled.div`
	color: ${(props) => props.theme.colors.yellow};
`;

export default FeeReclaimingSynth;
