import MarketClosureIcon from 'components/MarketClosureIcon';
import {
	AFTER_HOURS_SYNTHS,
	TSE_SYNTHS,
	LSE_SYNTHS,
	FIAT_SYNTHS,
	COMMODITY_SYNTHS,
} from 'constants/currency';
import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { GridDivCenteredRow } from 'styles/common';

const MarketClosureOverlay = ({
	marketClosureReason,
	openAfterHoursModalCallback,
	currencyKey,
	timer,
}) => {
	const { t } = useTranslation();

	return (
		<OverlayMessage>
			<MarketClosureIcon marketClosureReason={marketClosureReason} />
			<OverlayMessageTitle>
				{t(`exchange.price-chart-card.overlay-messages.${marketClosureReason}.title`)}
			</OverlayMessageTitle>
			<OverlayMessageSubtitle>
				{openAfterHoursModalCallback != null && AFTER_HOURS_SYNTHS.has(currencyKey ?? '') && (
					<>
						<Trans
							i18nKey="exchange.price-chart-card.overlay-messages.market-closure.after-hours"
							values={{
								linkText: t('exchange.price-chart-card.overlay-messages.market-closure.here'),
							}}
							components={{
								linkTag: <LinkTag onClick={openAfterHoursModalCallback} />,
							}}
						/>
					</>
				)}
			</OverlayMessageSubtitle>
			{marketClosureReason === 'market-closure' &&
			(AFTER_HOURS_SYNTHS.has(currencyKey ?? '') ||
				TSE_SYNTHS.has(currencyKey ?? '') ||
				LSE_SYNTHS.has(currencyKey ?? '') ||
				FIAT_SYNTHS.has(currencyKey ?? '') ||
				COMMODITY_SYNTHS.has(currencyKey ?? '')) ? (
				<>
					<OverlayMessageSubtitle>Market reopens in: </OverlayMessageSubtitle>
					<OverlayTimer>{timer}</OverlayTimer>
				</>
			) : (
				<OverlayMessageSubtitle>
					{t(`exchange.price-chart-card.overlay-messages.${marketClosureReason}.subtitle`)}
				</OverlayMessageSubtitle>
			)}
		</OverlayMessage>
	);
};

export default MarketClosureOverlay;

const OverlayMessage = styled(GridDivCenteredRow)`
	justify-items: center;
	text-align: center;
`;

const OverlayMessageTitle = styled.div`
	font-family: ${(props) => props.theme.fonts.bold};
	color: ${(props) => props.theme.colors.white};
	font-size: 14px;
	padding-top: 10px;
	padding-bottom: 5px;
`;

const OverlayMessageSubtitle = styled.div`
	color: ${(props) => props.theme.colors.silver};
	padding-bottom: 5px;
`;

const OverlayTimer = styled.div`
	font-family: ${(props) => props.theme.fonts.mono};
`;

const LinkTag = styled.span`
	color: ${(props) => props.theme.colors.goldColors.color1};
	text-decoration: underline;
	&:hover {
		cursor: pointer;
	}
`;
