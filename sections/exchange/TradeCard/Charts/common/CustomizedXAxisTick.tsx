import React from 'react';
import formatDate from 'date-fns/format';

import { isNumber } from 'lodash';

import { PERIOD_IN_HOURS } from 'constants/period';

const CustomizedXAxisTick = (props: any) => {
	const { dy, selectedChartPeriodLabel, x, y, payload } = props;
	const { value } = payload;

	if (!isNumber(value)) {
		return <div />;
	}

	const isPeriodOverOneDay =
		selectedChartPeriodLabel != null && selectedChartPeriodLabel.value > PERIOD_IN_HOURS.ONE_DAY;

	if (isPeriodOverOneDay) {
		const [day, month] = formatDate(Number(value), 'dd MMM').split(' ');

		return (
			<g transform={`translate(${x},${y})`}>
				<text x={0} y={0} dx={10} dy={dy} textAnchor="end" fill="#666">
					{day}
				</text>
				<text x={1} y={0} dx={10} dy={dy * 2.5} textAnchor="end" fill="#666">
					{month}
				</text>
			</g>
		);
	}

	const time = formatDate(Number(value), 'h:mma');
	return (
		<g transform={`translate(${x},${y})`}>
			<text x={0} y={0} dy={15} textAnchor="end" fill="#666">
				{time}
			</text>
		</g>
	);
};

export default CustomizedXAxisTick;
