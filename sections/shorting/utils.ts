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
}) => {
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

export const calculateProfitAndLoss = async ({
	currentSynthPrice,
	synthBorrowedAmount,
	syntheBorrowedHistory,
}: {
	currentSynthPrice: BigNumber;
	synthBorrowedAmount: BigNumber;
	syntheBorrowedHistory: SynthBorrowedHistoryItem[];
}): Promise<BigNumber> => {
	const [totalBorrowedAmount, totalRepaidAmount] = syntheBorrowedHistory.reduce(
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
