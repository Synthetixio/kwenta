import BigNumber from 'bignumber.js';

const MS_IN_YEAR = 31557600000;

export const calculateAccuredInterest = ({
	currentBorrowSize,
	accruedInterestAsOfLastUpdate,
	shortRate,
	accruedInterestLastUpdateTimestamp,
}: {
	currentBorrowSize: BigNumber;
	accruedInterestAsOfLastUpdate: BigNumber;
	shortRate: BigNumber;
	accruedInterestLastUpdateTimestamp: number;
}): BigNumber => {
	const timeDifferenceMS = Date.now() - accruedInterestLastUpdateTimestamp;
	const numYears = new BigNumber(timeDifferenceMS).div(MS_IN_YEAR);
	const additionalInterest = numYears.times(shortRate).times(currentBorrowSize);
	return accruedInterestAsOfLastUpdate.plus(additionalInterest);
};

type SynthBorrowedHistoryItem = {
	rate: BigNumber;
	amount: BigNumber;
	isRepayment: boolean;
};

export const calculateProfitAndLoss = ({
	currentSynthPrice,
	synthBorrowedAmount,
	synthBorrowedHistory,
}: {
	currentSynthPrice: BigNumber;
	synthBorrowedAmount: BigNumber;
	synthBorrowedHistory: SynthBorrowedHistoryItem[];
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
		.minus(totalRepaidAmount)
		.minus(currentSynthPrice.times(synthBorrowedAmount));
};
