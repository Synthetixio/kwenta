import BigNumber from 'bignumber.js';
import { calculateProfitAndLoss } from '../../utils/shorts';

let dayOldTimestamp: number;
let twoDayOldTimestamp: number;

beforeAll(() => {
	const date = new Date();
	date.setDate(date.getDate() - 1);
	dayOldTimestamp = date.getTime();
	const secondDate = new Date();
	secondDate.setDate(secondDate.getDate() - 2);
	twoDayOldTimestamp = secondDate.getTime();
});

test('test calculate profit and loss is working correctly', () => {
	/**
	 * NOTE this unit test assumes interest accrues at 10% daily interest with a constant rate
	 * so you take a loan of 11 at a rate of 1 ($11) and this generates 10% interest
	 * so a day later you owe $12.1, and then you pay back 2.1 at a rate of 1 = $2.1
	 * and then a day after you now owe 11 including an accrued interest of 1.
	 * The user now owes back 11 at a price of $1 = $11 and has spent $2.1 for a total of $13.1.
	 * They should have a loss of $2.10 on the short since the price has increased
	 * over time
	 * */

	expect(
		calculateProfitAndLoss({
			currentSynthPrice: new BigNumber(1),
			synthBorrowedAmount: new BigNumber(10),
			synthBorrowedHistory: [
				{
					rate: new BigNumber(1),
					amount: new BigNumber(11),
					isRepayment: false,
					loanAfter: new BigNumber(11),
					timestamp: twoDayOldTimestamp,
				},
				{
					rate: new BigNumber(1),
					amount: new BigNumber(2.1),
					isRepayment: true,
					loanAfter: new BigNumber(10),
					timestamp: dayOldTimestamp,
				},
			],
			interestAccrued: new BigNumber(1),
		})
	).toBe('-2.1');
});

test('test calculate profit and loss is working correctly', () => {
	/**
	 * NOTE this unit test assumes interest accrues at 10% daily interest
	 * so you take a loan of 11 at a rate of 1 ($11) and this generates 10% interest
	 * so a day later you owe 12.1, and then you pay back 2.1 at a rate of 0.5 = $1.05
	 * and then a day after you now owe 11 including an accrued interest of 1.
	 * The user now owes back 11 at a price of $0.25 = $2.75 and has spent $1.05 for a total of $3.80.
	 * They should have a profit of $7.20 on the short since the price has increased
	 * over time
	 * */

	expect(
		calculateProfitAndLoss({
			currentSynthPrice: new BigNumber(0.25),
			synthBorrowedAmount: new BigNumber(10),
			synthBorrowedHistory: [
				{
					rate: new BigNumber(1),
					amount: new BigNumber(11),
					isRepayment: false,
					loanAfter: new BigNumber(11),
					timestamp: twoDayOldTimestamp,
				},
				{
					rate: new BigNumber(0.5),
					amount: new BigNumber(2.1),
					isRepayment: true,
					loanAfter: new BigNumber(10),
					timestamp: dayOldTimestamp,
				},
			],
			interestAccrued: new BigNumber(1),
		})
	).toBe('7.2');
});

test('test calculate profit and loss is working correctly', () => {
	/**
	 * NOTE this unit test assumes interest accrues at 10% daily interest
	 * so you take a loan of 11 at a rate of 1 ($11) and this generates 10% interest
	 * so a day later you owe 12.1, and then you pay back 2.1 at a rate of 1.5 = $3.15
	 * and then a day after you now owe 11 including an accrued interest of 1.
	 * The user now owes back 11 at a price of $1.1 = $12.1 and has spent $3.15 for a total of $15.25.
	 * They should have a loss of $4.25 on the short since the price has increased
	 * over time
	 * */

	expect(
		calculateProfitAndLoss({
			currentSynthPrice: new BigNumber(1.1),
			synthBorrowedAmount: new BigNumber(10),
			synthBorrowedHistory: [
				{
					rate: new BigNumber(1),
					amount: new BigNumber(11),
					isRepayment: false,
					loanAfter: new BigNumber(11),
					timestamp: twoDayOldTimestamp,
				},
				{
					rate: new BigNumber(1.5),
					amount: new BigNumber(2.1),
					isRepayment: true,
					loanAfter: new BigNumber(10),
					timestamp: dayOldTimestamp,
				},
			],
			interestAccrued: new BigNumber(1),
		})
	).toBe('-4.25');
});
