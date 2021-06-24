import { SYNTHS_MAP } from 'constants/currency';
import marketNextOpen, { usNextOpen } from 'utils/marketNextOpen';

test('test sTSLA maps correctly to us market open hours', () => {
	expect(marketNextOpen(SYNTHS_MAP.sTSLA)).toStrictEqual(usNextOpen());
});
