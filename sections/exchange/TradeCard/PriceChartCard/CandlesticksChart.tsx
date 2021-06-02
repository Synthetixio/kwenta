import { formatEther } from '@ethersproject/units';
import RechartsResponsiveContainer from 'components/RechartsResponsiveContainer';
import { PeriodLabel, PERIOD_IN_HOURS } from 'constants/period';
import { format } from 'date-fns';
import { isNumber } from 'lodash';
import useCandlesticksQuery from 'queries/rates/useCandlesticksQuery';
import React, { FC } from 'react';
import { BarChart, XAxis, YAxis, Bar, Cell } from 'recharts';
import { Tooltip } from 'styles/common';
import theme from 'styles/theme';

type CandlestickChartProps = {
	currencyKey: string | null;
	selectedPeriod: PeriodLabel;
};

const CandlestickChart: FC<CandlestickChartProps> = ({ currencyKey, selectedPeriod }) => {
	const candlesticksQuery = useCandlesticksQuery(currencyKey, selectedPeriod.period);

	const candlesticksData =
		candlesticksQuery.isSuccess && candlesticksQuery.data ? candlesticksQuery.data : [];

	const data = candlesticksData?.map((candle: any) => ({
		timestamp: Number(candle.timestamp) * 1000,
		uv: [Number(formatEther(candle.open)), Number(formatEther(candle.close))],
		pv: [Number(formatEther(candle.high)), Number(formatEther(candle.low))],
	}));

	const fontStyle = {
		fontSize: '12px',
		fill: theme.colors.white,
		fontFamily: theme.fonts.mono,
	};

	return (
		<RechartsResponsiveContainer width="100%" height="100%">
			<BarChart barGap={-2.5} data={data} margin={{ right: 0, bottom: 0, left: 0, top: 0 }}>
				<XAxis
					// @ts-ignore
					dx={-1}
					dy={10}
					minTickGap={20}
					dataKey="timestamp"
					allowDataOverflow={true}
					axisLine={false}
					tickLine={false}
					tick={fontStyle}
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
					domain={['dataMin', 'dataMax']}
					orientation="right"
					axisLine={false}
					tickLine={false}
					tick={fontStyle}
				/>
				<Tooltip />
				<Bar dataKey="pv" barSize={1}>
					{data.map((datum: { uv: number[] }, index: number) => (
						<Cell
							key={`cell-${index}`}
							fill={datum.uv[1] - datum.uv[0] > 0 ? '#6DDA78' : '#E0306B'}
						/>
					))}
				</Bar>
				<Bar dataKey="uv" barSize={4} fill={theme.colors.red} radius={2}>
					{data.map((datum: { uv: number[] }, index: number) => (
						<Cell
							key={`cell-${index}`}
							fill={datum.uv[1] - datum.uv[0] > 0 ? '#6DDA78' : '#E0306B'}
						/>
					))}
				</Bar>
			</BarChart>
		</RechartsResponsiveContainer>
	);
};

export default CandlestickChart;
