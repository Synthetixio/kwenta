import BigNumber from 'bignumber.js';

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
	interestAccrued,
}: {
	currentSynthPrice: BigNumber;
	synthBorrowedAmount: BigNumber;
	synthBorrowedHistory: SynthBorrowedHistoryItem[];
	interestAccrued: BigNumber;
}): BigNumber => {
	const [totalBorrowedAmount, totalRepaidAmount] = synthBorrowedHistory.reduce(
		([borrowed, repaid], { rate, amount, isRepayment }) => {
			return isRepayment
				? [borrowed, repaid.plus(rate.times(amount))]
				: [borrowed.plus(rate.times(amount)), repaid];
		},
		[new BigNumber(0), new BigNumber(0)]
	);

	return totalBorrowedAmount
		.minus(interestAccrued)
		.minus(totalRepaidAmount)
		.minus(currentSynthPrice.times(synthBorrowedAmount));
};
