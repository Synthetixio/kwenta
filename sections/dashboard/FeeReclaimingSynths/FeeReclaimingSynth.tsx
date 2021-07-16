import { FC, useMemo, useState } from 'react';
import { ethers } from 'ethers';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import Countdown, { zeroPad } from 'react-countdown';
import addTime from 'date-fns/add';
import { Svg } from 'react-optimized-image';
import BigNumber from 'bignumber.js';

import synthetix from 'lib/synthetix';
import { useRecoilValue } from 'recoil';
import { walletAddressState } from 'store/wallet';
import media from 'styles/media';
import TransactionNotifier from 'containers/TransactionNotifier';
import Currency from 'components/Currency';
import Button from 'components/Button';
import CircleEllipsis from 'assets/svg/app/circle-ellipsis.svg';
import { formatCurrency } from 'utils/formatters/number';
import useSelectedPriceCurrency from 'hooks/useSelectedPriceCurrency';
import { CurrencyKey, SYNTHS_MAP } from 'constants/currency';
import useGas from 'hooks/useGas';
import useCurrencyPrice from 'hooks/useCurrencyPrice';

const FeeReclaimingSynth: FC<{
	currencyKey: CurrencyKey;
	waitingPeriod: number;
	fee: BigNumber;
	noOfTrades: number;
}> = ({ currencyKey, waitingPeriod, fee, noOfTrades }) => {
	const { t } = useTranslation();

	const hasWaitingPeriod = useMemo(() => waitingPeriod !== 0, [waitingPeriod]);
	const hasFee = useMemo(() => !fee.isZero(), [fee]);
	const adjustmentEndDate = useMemo(() => addTime(new Date(), { seconds: waitingPeriod }), [
		waitingPeriod,
	]);

	const [isSettling, setIsSettling] = useState<boolean>(false);
	const [txError, setTxError] = useState<string | null>(null);
	const { monitorTransaction } = TransactionNotifier.useContainer();
	const address = useRecoilValue(walletAddressState);
	const price = useCurrencyPrice(currencyKey);
	const { gasPrice, gasPriceWei, getGasLimitEstimate } = useGas();

	const onSettleFee = async () => {
		if (synthetix.js != null && gasPrice != null) {
			setTxError(null);

			const { Exchanger } = synthetix.js!.contracts;
			const method = 'settle';
			const params = [address, ethers.utils.formatBytes32String(currencyKey)];

			try {
				setIsSettling(true);

				const gasLimitEstimate = await getGasLimitEstimate(() =>
					Exchanger.estimateGas[method](...params)
				);

				let transaction: ethers.ContractTransaction | null = null;
				transaction = (await Exchanger[method](...params, {
					gasPrice: gasPriceWei,
					gasLimit: gasLimitEstimate,
				})) as ethers.ContractTransaction;

				if (transaction != null) {
					monitorTransaction({
						txHash: transaction.hash,
					});
					await transaction.wait();
				}
			} catch (e) {
				try {
					await Exchanger.callStatic[method](...params);
					throw e;
				} catch (e) {
					console.log(e);
					setTxError(e.message);
				}
			} finally {
				setIsSettling(false);
			}
		}
	};

	return !(hasWaitingPeriod || hasFee) ? null : (
		<Container>
			<ColorLine />
			<Currency.Icon currencyKey={currencyKey} width="24px" height="24px" />
			<Col>
				<MainColTitle>{currencyKey}</MainColTitle>
				<MainColSubtitle>
					{hasWaitingPeriod
						? t('dashboard.fee-reclaiming-synths.row.main-col-subtitle')
						: t('dashboard.fee-reclaiming-synths.row.main-col-complete-subtitle')}
				</MainColSubtitle>
			</Col>
			<Col>
				<ColTitle>{noOfTrades}</ColTitle>
				<ColSubtitle>{t('dashboard.fee-reclaiming-synths.row.col-trades')}</ColSubtitle>
			</Col>
			<Col>
				<ColTitle>
					{hasWaitingPeriod ? (
						<PendingIcon>
							<Svg src={CircleEllipsis} />
						</PendingIcon>
					) : (
						<Change {...{ currencyKey }} value={fee.multipliedBy(price)} />
					)}
				</ColTitle>
				<ColSubtitle>{t('dashboard.fee-reclaiming-synths.row.col-debt-surplus')}</ColSubtitle>
			</Col>
			<Col>
				{hasWaitingPeriod ? (
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
				) : (
					<ColTitle>
						<Button
							variant="primary"
							isRounded={true}
							onClick={onSettleFee}
							size="md"
							disabled={isSettling}
						>
							{isSettling
								? t('dashboard.fee-reclaiming-synths.settling-fee')
								: t('dashboard.fee-reclaiming-synths.settle-fee')}
						</Button>
					</ColTitle>
				)}
			</Col>
		</Container>
	);
};

const Change: FC<{ currencyKey: CurrencyKey; value: BigNumber }> = ({ currencyKey, value }) => {
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
