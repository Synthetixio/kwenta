import BigNumber from 'bignumber.js';
import { ShortLiquidation } from '../queries/collateral/subgraph/types';

type SynthBorrowedHistoryItem = {
	rate: BigNumber;
	amount: BigNumber;
	isRepayment: boolean;
	loanAfter: BigNumber;
	timestamp: number;
};

export const calculateProfitAndLoss = ({
	currentSynthPrice,
	synthBorrowedAmount,
	synthBorrowedHistory,
	shortLiquidations,
	interestAccrued,
}: {
	currentSynthPrice: BigNumber;
	synthBorrowedAmount: BigNumber;
	synthBorrowedHistory: SynthBorrowedHistoryItem[];
	shortLiquidations: ShortLiquidation[];
	interestAccrued: BigNumber;
}): string => {
	const [totalBorrowedAmount, totalRepaidAmount] = synthBorrowedHistory.reduce(
		([borrowed, repaid], { rate, amount, isRepayment }) => {
			return isRepayment
				? [borrowed, repaid.plus(rate.times(amount))]
				: [borrowed.plus(rate.times(amount)), repaid];
		},
		[new BigNumber(0), new BigNumber(0)]
	);

	const liduiatedAmount = shortLiquidations.reduce((acc, { liquidatedCollateral }) => {
		return acc.plus(liquidatedCollateral);
	}, new BigNumber(0));

	return totalBorrowedAmount
		.minus(currentSynthPrice.times(interestAccrued))
		.minus(totalRepaidAmount)
		.minus(currentSynthPrice.times(synthBorrowedAmount))
		.minus(liduiatedAmount)
		.toString();
};
