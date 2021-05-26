import { atom } from 'recoil';

import { Language } from 'translations/constants';

import { DEFAULT_LANGUAGE, DEFAULT_PRICE_CURRENCY } from 'constants/defaults';
import { PeriodLabel, PERIOD_LABELS_MAP } from 'constants/period';
import { SYNTHS_MAP } from 'constants/currency';

import { Synth } from 'lib/synthetix';

import { getAppKey } from '../utils';

import { languageStateKey, priceCurrencyStateKey, chartPeriodStateKey } from './constants';

export const PRICE_CURRENCIES = [
	SYNTHS_MAP.sUSD,
	SYNTHS_MAP.sEUR,
	SYNTHS_MAP.sCHF,
	SYNTHS_MAP.sAUD,
	SYNTHS_MAP.sJPY,
	SYNTHS_MAP.sGBP,
	SYNTHS_MAP.sBTC,
	SYNTHS_MAP.sETH,
];

export const appReadyState = atom<boolean>({
	key: getAppKey('appReady'),
	default: false,
});

export const languageState = atom<Language>({
	key: languageStateKey,
	default: DEFAULT_LANGUAGE,
});

export const priceCurrencyState = atom<Synth>({
	key: priceCurrencyStateKey,
	default: DEFAULT_PRICE_CURRENCY,
});

export const chartPeriodState = atom<PeriodLabel>({
	key: chartPeriodStateKey,
	default: PERIOD_LABELS_MAP.ONE_DAY,
});
