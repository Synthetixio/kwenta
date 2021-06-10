import { useContext, FC } from 'react';
import { AreaChart as BaseAreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import isNumber from 'lodash/isNumber';
import get from 'lodash/get';
import { ThemeContext } from 'styled-components';
import format from 'date-fns/format';

import RechartsResponsiveContainer from 'components/RechartsResponsiveContainer';
import { Synth } from 'lib/synthetix';
import { CurrencyKey } from 'constants/currency';
import { PERIOD_IN_HOURS, PeriodLabel } from 'constants/period';
import { formatNumber } from 'utils/formatters/number';

import CustomTooltip from '../common/CustomTooltip';

const AreaChart: FC<{
	quoteCurrencyKey: CurrencyKey | null;
	baseCurrencyKey: CurrencyKey | null;
	selectedPeriod: PeriodLabel;
	changes: {
		timestamp: number;
		change: number;
	}[];
	change: number | null;
	setCurrentPrice: (price: number | null) => void;
	noData: boolean | undefined;
}> = ({
	quoteCurrencyKey,
	baseCurrencyKey,
	selectedPeriod,
	changes,
	change,
	setCurrentPrice,
	noData,
}) => {
	const theme = useContext(ThemeContext);

	const isChangePositive = change != null && change >= 0;
	const chartColor = isChangePositive ? theme.colors.green : theme.colors.red;

	let linearGradientId = `priceChartCardArea`;

	const fontStyle = {
		fontSize: '12px',
		fill: theme.colors.white,
		fontFamily: theme.fonts.mono,
	};

	return (
		<RechartsResponsiveContainer
			width="100%"
			height="100%"
			id={`rechartsResponsiveContainer-${baseCurrencyKey}/${quoteCurrencyKey}`}
		>
			<BaseAreaChart
				data={changes}
				margin={{ right: 0, bottom: 0, left: 0, top: 0 }}
				onMouseMove={(e: any) => {
					const currentRate = get(e, 'activePayload[0].payload.change', null);
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
					domain={['auto', 'auto']}
					tick={fontStyle}
					orientation="right"
					axisLine={false}
					tickLine={false}
					tickFormatter={(val) =>
						formatNumber(val, {
							minDecimals: getMinNoOfDecimals(val),
						})
					}
				/>
				<Area
					dataKey="change"
					stroke={chartColor}
					dot={false}
					strokeWidth={2}
					fill={`url(#${linearGradientId})`}
					isAnimationActive={false}
				/>
				{baseCurrencyKey && quoteCurrencyKey && !noData && (
					<Tooltip
						isAnimationActive={false}
						position={{
							y: 0,
						}}
						content={
							// @ts-ignore
							<CustomTooltip
								formatCurrentPrice={(n: number) =>
									formatNumber(n, {
										minDecimals: getMinNoOfDecimals(n),
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

export function getMinNoOfDecimals(value: number): number {
	let decimals = 2;
	if (value < 1) {
		const [, afterDecimal] = value.toString().split('.'); // todo
		if (afterDecimal) {
			for (let i = 0; i < afterDecimal.length; i++) {
				const n = afterDecimal[i];
				if (parseInt(n) !== 0) {
					decimals = i + 3;
					break;
				}
			}
		}
	}
	return decimals;
}

export default AreaChart;
