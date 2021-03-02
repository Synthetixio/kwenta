import BigNumber from 'bignumber.js';
import { calculateProfitAndLoss } from '../../utils/shorts';

test('test calculate profit and loss is working correctly', () => {
	expect(
		calculateProfitAndLoss({
			currentSynthPrice: new BigNumber(1.1),
			synthBorrowedAmount: new BigNumber(10),
			synthBorrowedHistory: [
				{
					rate: new BigNumber(1),
					amount: new BigNumber(10),
					isRepayment: false,
					loanAfter: new BigNumber(10),
					timestamp: 123212324,
				},
			],
			interestAccrued: new BigNumber(0.5),
		})
	).toBe(-1.5);
});
