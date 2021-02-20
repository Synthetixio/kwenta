import BigNumber from 'bignumber.js';
import { InterestRateHistory, SynthBorrowedHistoryItem } from 'queries/short/types';

const MS_IN_YEAR = 31557600000;

export const calculateInterestAndProfitLoss = ({
	accruedInterestAsOfLastUpdate,
	accruedInterestLastUpdateTimestamp,
	interestRateHistory,
	synthBorrowedHistory,
	currentSynthPrice,
	synthBorrowedAmount,
}: {
	accruedInterestAsOfLastUpdate: BigNumber;
	accruedInterestLastUpdateTimestamp: number;
	currentSynthPrice: BigNumber;
	synthBorrowedAmount: BigNumber;
	interestRateHistory: InterestRateHistory[];
	synthBorrowedHistory: SynthBorrowedHistoryItem[];
}) => ({
	interestAccrued: calculateAccuredInterest({
		accruedInterestAsOfLastUpdate,
		accruedInterestLastUpdateTimestamp,
		synthBorrowedHistory,
		interestRateHistory,
	}),
	profitLoss: calculateProfitAndLoss({
		currentSynthPrice,
		synthBorrowedAmount,
		synthBorrowedHistory,
		interestRateHistory,
	}),
});

export const calculateAccuredInterest = ({
	accruedInterestAsOfLastUpdate,
	accruedInterestLastUpdateTimestamp,
	synthBorrowedHistory,
	interestRateHistory,
}: {
	accruedInterestAsOfLastUpdate: BigNumber;
	accruedInterestLastUpdateTimestamp: number;
	synthBorrowedHistory: SynthBorrowedHistoryItem[];
	interestRateHistory: InterestRateHistory[];
}): BigNumber => {
	let interestAccruedSinceLastUpdate = new BigNumber(0);

	const relevantRates = interestRateHistory.filter(
		({ timestamp }) => timestamp > accruedInterestLastUpdateTimestamp
	);
	const relevantBorrowHistory = synthBorrowedHistory.filter(
		({ timestamp }) => timestamp > accruedInterestLastUpdateTimestamp
	);

	const formattedBorrowHistory =
		relevantBorrowHistory.length !== synthBorrowedHistory.length
			? [synthBorrowedHistory[relevantBorrowHistory.length - synthBorrowedHistory.length]].concat(
					relevantBorrowHistory
			  )
			: relevantBorrowHistory;

	const formattedRateHistory =
		relevantRates.length !== interestRateHistory.length
			? [interestRateHistory[relevantRates.length - interestRateHistory.length]].concat(
					relevantRates
			  )
			: relevantRates;

	let lastRateTimestamp = null;
	for (let i = 0; i < formattedRateHistory.length; i++) {
		const timeDifferenceMS =
			lastRateTimestamp == null
				? formattedRateHistory[i].timestamp - accruedInterestLastUpdateTimestamp
				: formattedRateHistory[i].timestamp - lastRateTimestamp;
		lastRateTimestamp = formattedRateHistory[i].timestamp;
		const numFractionalYears = new BigNumber(timeDifferenceMS).div(MS_IN_YEAR);
		for (let j = 0; j < formattedBorrowHistory.length; j++) {}
		interestAccruedSinceLastUpdate.plus(
			numFractionalYears.times(formattedRateHistory[i].rate).times(0)
		);
	}
	return accruedInterestAsOfLastUpdate.plus(interestAccruedSinceLastUpdate);
};

export const calculateProfitAndLoss = ({
	currentSynthPrice,
	synthBorrowedAmount,
	synthBorrowedHistory,
	interestRateHistory,
}: {
	currentSynthPrice: BigNumber;
	synthBorrowedAmount: BigNumber;
	synthBorrowedHistory: SynthBorrowedHistoryItem[];
	interestRateHistory: InterestRateHistory[];
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
