import { useContext, FC, useMemo } from 'react';
import { AreaChart as BaseAreaChart, XAxis, YAxis, Area, Tooltip } from 'recharts';
import isNumber from 'lodash/isNumber';
import get from 'lodash/get';
import { ThemeContext } from 'styled-components';
import format from 'date-fns/format';

import { Synth } from 'lib/synthetix';
import { CurrencyKey, SYNTHS_MAP } from 'constants/currency';
import { PERIOD_IN_HOURS, PeriodLabel } from 'constants/period';
import RechartsResponsiveContainer from 'components/RechartsResponsiveContainer';
import { RateUpdates } from 'queries/rates/types';
import { formatCurrency } from 'utils/formatters/number';

import { Side } from '../../types';
import CustomTooltip from '../common/CustomTooltip';

const AreaChart: FC<{
	rates: RateUpdates;
	change: number | null;
	selectedPeriod: PeriodLabel;
	selectedPriceCurrency: Synth;
	selectPriceCurrencyRate: number | null;
	currencyKey: CurrencyKey | null;
	side: Side;
	setCurrentPrice: (price: number | null) => void;
	noData: boolean | undefined;
}> = ({
	currencyKey,
	selectedPeriod,
	selectedPriceCurrency,
	rates,
	change,
	selectPriceCurrencyRate,
	side,
	setCurrentPrice,
	noData,
}) => {
	const theme = useContext(ThemeContext);

	const isSUSD = currencyKey === SYNTHS_MAP.sUSD;
	const isChangePositive = change != null && change >= 0;
	const chartColor = isChangePositive || isSUSD ? theme.colors.green : theme.colors.red;

	let linearGradientId = `priceChartCardArea-${side}`;

	const fontStyle = {
		fontSize: '12px',
		fill: theme.colors.white,
		fontFamily: theme.fonts.mono,
	};

	const computedRates = useMemo(() => {
		if (selectPriceCurrencyRate != null) {
			return rates.map((rateData) => ({
				...rateData,
				rate: rateData.rate / selectPriceCurrencyRate,
			}));
		}
		return rates;
	}, [rates, selectPriceCurrencyRate]);

	return (
		<RechartsResponsiveContainer
			width="100%"
			height="100%"
			id={`rechartsResponsiveContainer-${side}-${currencyKey}`}
		>
			<BaseAreaChart
				data={computedRates}
				margin={{ right: 0, bottom: 0, left: 0, top: 0 }}
				onMouseMove={(e: any) => {
					const currentRate = get(e, 'activePayload[0].payload.rate', null);
					if (currentRate) {
						setCurrentPrice(currentRate);
					} else {
						setCurrentPrice(null);
					}
				}}
				onMouseLeave={(e: any) => {
					setCurrentPrice(null);
				}}
			>
				<defs>
					<linearGradient id={linearGradientId} x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stopColor={chartColor} stopOpacity={0.5} />
						<stop offset="100%" stopColor={chartColor} stopOpacity={0} />
					</linearGradient>
				</defs>
				<XAxis
					// @ts-ignore
					dx={-1}
					dy={10}
					minTickGap={20}
					dataKey="timestamp"
					allowDataOverflow={true}
					tick={fontStyle}
					axisLine={false}
					tickLine={false}
					tickFormatter={(val) => {
						if (!isNumber(val)) {
							return '';
						}
						const periodOverOneDay =
							selectedPeriod != null && selectedPeriod.value > PERIOD_IN_HOURS.ONE_DAY;

						return format(val, periodOverOneDay ? 'dd MMM' : 'h:mma');
					}}
				/>
				<YAxis
					// TODO: might need to adjust the width to make sure we do not trim the values...
					type="number"
					allowDataOverflow={true}
					domain={isSUSD ? ['dataMax', 'dataMax'] : ['auto', 'auto']}
					tick={fontStyle}
					orientation="right"
					axisLine={false}
					tickLine={false}
					tickFormatter={(val) =>
						formatCurrency(selectedPriceCurrency.name, val, {
							sign: selectedPriceCurrency.sign,
						})
					}
				/>
				<Area
					dataKey="rate"
					stroke={chartColor}
					dot={false}
					strokeWidth={2}
					fill={`url(#${linearGradientId})`}
					isAnimationActive={false}
				/>
				{currencyKey != null && !noData && (
					<Tooltip
						isAnimationActive={false}
						position={{
							y: 0,
						}}
						content={
							// @ts-ignore
							<CustomTooltip
								formatCurrentPrice={(n: number) =>
									formatCurrency(selectedPriceCurrency.name, n, {
										sign: selectedPriceCurrency.sign,
									})
								}
							/>
						}
					/>
				)}
			</BaseAreaChart>
		</RechartsResponsiveContainer>
	);
};

export default AreaChart;
