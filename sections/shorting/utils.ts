import BigNumber from 'bignumber.js';
import { orderBy } from 'lodash';

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
}) => {
	const interestAccrued = calculateAccuredInterest({
		accruedInterestAsOfLastUpdate,
		accruedInterestLastUpdateTimestamp,
		synthBorrowedAmount,
		interestRateHistory,
	});
	return {
		interestAccrued,
		profitLoss: calculateProfitAndLoss({
			currentSynthPrice,
			synthBorrowedAmount,
			synthBorrowedHistory,
			interestAccrued,
		}),
	};
};

export const calculateAccuredInterest = ({
	accruedInterestAsOfLastUpdate,
	accruedInterestLastUpdateTimestamp,
	synthBorrowedAmount,
	interestRateHistory,
}: {
	accruedInterestAsOfLastUpdate: BigNumber;
	accruedInterestLastUpdateTimestamp: number;
	synthBorrowedAmount: BigNumber;
	interestRateHistory: InterestRateHistory[];
}): BigNumber => {
	let interestAccruedSinceLastUpdate = new BigNumber(0);

	const recentRateUpdates = orderBy(interestRateHistory, 'timestamp', 'desc')
		.reduce(
			(
				acc: { singlePreviousEnrtyObtained: boolean; relevantEntries: InterestRateHistory[] },
				curr: InterestRateHistory
			) => {
				if (curr.timestamp > accruedInterestLastUpdateTimestamp) {
					acc.relevantEntries.push(curr);
				} else if (!acc.singlePreviousEnrtyObtained) {
					acc.relevantEntries.push(curr);
					acc.singlePreviousEnrtyObtained = true;
				}
				return acc;
			},
			{ singlePreviousEnrtyObtained: false, relevantEntries: [] }
		)
		.relevantEntries.reverse();

	for (let i = 0; i < recentRateUpdates.length; i++) {
		const timeDifferenceMS = calculateTimeDiff({
			startTime: recentRateUpdates[i].timestamp,
			endTime: recentRateUpdates[i + 1]?.timestamp ?? undefined,
			lastUpdateTime: accruedInterestLastUpdateTimestamp,
		});
		const newAccruedInterest = new BigNumber(timeDifferenceMS)
			.div(MS_IN_YEAR)
			.times(synthBorrowedAmount)
			.times(recentRateUpdates[i].rate);
		interestAccruedSinceLastUpdate.plus(newAccruedInterest);
	}
	return accruedInterestAsOfLastUpdate.plus(interestAccruedSinceLastUpdate);
};

const calculateTimeDiff = ({
	startTime,
	endTime,
	lastUpdateTime,
}: {
	startTime: number;
	endTime: number | undefined;
	lastUpdateTime: number;
}) => {
	if (startTime < lastUpdateTime && endTime == null) {
		return Date.now() - lastUpdateTime;
	} else if (startTime < lastUpdateTime && endTime) {
		return endTime - lastUpdateTime;
	} else if (endTime == null) {
		return Date.now() - startTime;
	} else {
		return endTime - startTime;
	}
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
