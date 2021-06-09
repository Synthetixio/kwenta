import { FC, useContext } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';
import styled, { ThemeContext } from 'styled-components';

import { CurrencyKey } from 'constants/currency';
import { PeriodLabel } from 'constants/period';
import { Side } from 'sections/exchange/TradeCard/types';
import useCompareChartData from 'sections/exchange/hooks/useCompareChartData';
import RechartsResponsiveContainer from 'components/RechartsResponsiveContainer';
import { formatCurrency, formatNumber } from 'utils/formatters/number';
import { TooltipContentStyle as BaseTooltipContentStyle } from 'sections/exchange/TradeCard/Charts/common/styles';

const CompareCharts: FC<{
	side: Side;
	baseCurrencyKey: CurrencyKey | null;
	quoteCurrencyKey: CurrencyKey | null;
	selectedPeriod: PeriodLabel;
}> = ({ side, baseCurrencyKey, quoteCurrencyKey, selectedPeriod }) => {
	const theme = useContext(ThemeContext);
	const fontStyle = {
		fontSize: '12px',
		fill: theme.colors.white,
		fontFamily: theme.fonts.mono,
	};

	const { data, noData } = useCompareChartData({
		baseCurrencyKey,
		quoteCurrencyKey,
		selectedPeriod,
	});

	return (
		<RechartsResponsiveContainer
			width="100%"
			height="100%"
			id={`rechartsResponsiveContainer-${side}-${baseCurrencyKey}-${quoteCurrencyKey}`}
		>
			<LineChart {...{ data }} margin={{ right: 15, bottom: 0, left: 0, top: 0 }}>
				{/* <defs>
					<linearGradient id={linearGradientId} x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stopColor={chartColor} stopOpacity={0.5} />
						<stop offset="100%" stopColor={chartColor} stopOpacity={0} />
					</linearGradient>
				</defs>
				*/}
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
					hide={true}
				/>
				<YAxis
					// TODO: might need to adjust the width to make sure we do not trim the values...
					type="number"
					allowDataOverflow={true}
					tick={fontStyle}
					orientation="right"
					axisLine={false}
					tickLine={false}
					yAxisId="base"
					hide={true}
					domain={['dataMin', 'dataMax']}
				/>
				<YAxis
					// TODO: might need to adjust the width to make sure we do not trim the values...
					type="number"
					allowDataOverflow={true}
					tick={fontStyle}
					orientation="right"
					axisLine={false}
					tickLine={false}
					yAxisId="quote"
					hide={true}
					domain={['dataMin', 'dataMax']}
				/>
				<Line
					type="monotone"
					yAxisId="base"
					dataKey="baseRate"
					stroke="#395BC5"
					strokeWidth={2}
					dot={false}
				/>
				<Line
					type="monotone"
					yAxisId="quote"
					dataKey="quoteRate"
					stroke="#7AC09F"
					strokeWidth={2}
					dot={false}
				/>
				{baseCurrencyKey && quoteCurrencyKey && !noData && (
					<Tooltip
						isAnimationActive={false}
						position={{
							y: 0,
						}}
						content={
							// @ts-ignore
							<CustomTooltip {...{ baseCurrencyKey, quoteCurrencyKey }} />
						}
					/>
				)}
			</LineChart>
		</RechartsResponsiveContainer>
	);
};

const CustomTooltip: FC<{
	active: boolean;
	payload: { value: number }[];
	label: Date;
	baseCurrencyKey: CurrencyKey | null;
	quoteCurrencyKey: CurrencyKey | null;
}> = ({ active, label, payload, baseCurrencyKey, quoteCurrencyKey }) => {
	if (!(active && payload && payload.length === 2)) return null;

	const [{ value: baseRate }, { value: quoteRate }] = payload;
	return (
		<TooltipContentStyle>
			<LabelStyle>{baseCurrencyKey}</LabelStyle>
			<ValueStyle>{formatCurrency(baseCurrencyKey!, baseRate, { sign: '$' })}</ValueStyle>
			<br />
			<LabelStyle>{quoteCurrencyKey}</LabelStyle>
			<ValueStyle>{formatCurrency(quoteCurrencyKey!, quoteRate, { sign: '$' })}</ValueStyle>
		</TooltipContentStyle>
	);
};

export default CompareCharts;

export const TooltipContentStyle = styled(BaseTooltipContentStyle)`
	padding: 12px;
`;

const LabelStyle = styled.div``;

const ValueStyle = styled.div`
	color: white;
`;
