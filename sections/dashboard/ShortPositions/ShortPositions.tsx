import { FC } from 'react';
import Link from 'next/link';
import styled from 'styled-components';
import { useTranslation, Trans } from 'react-i18next';

import { SYNTHS_MAP } from 'constants/currency';

import useShortContractDataQuery from 'queries/short/useShortContractDataQuery';

import media from 'styles/media';
import { GridDivCentered, NoTextTransform } from 'styles/common';

import Button from 'components/Button';

import ShortPositionsRow, { ShortPositionsRowProps } from './ShortPositionsRow';
import ROUTES from 'constants/routes';

const { sUSD } = SYNTHS_MAP;

type ShortPositionsProps = Omit<ShortPositionsRowProps, 'shortInfo'>;

const ShortPositions: FC<ShortPositionsProps> = ({ exchangeRates }) => {
	const { t } = useTranslation();

	const shortLoanData = useShortContractDataQuery();

	if (shortLoanData.isSuccess) {
		const currentShorts = shortLoanData.data!.shorts;
		if (!currentShorts || !currentShorts.length) {
			return (
				<NoShortsContainer>
					<Message>
						<Trans
							t={t}
							i18nKey="exchange.short.message"
							values={{ currencyKey: sUSD }}
							components={[<NoTextTransform />]}
						/>
					</Message>
					<Link href={ROUTES.Exchange.Short}>
						<Button size="lg" variant="primary" isRounded={true}>
							<Trans
								t={t}
								i18nKey="common.currency.buy-currency"
								values={{ currencyKey: sUSD }}
								components={[<NoTextTransform />]}
							/>
						</Button>
					</Link>
				</NoShortsContainer>
			);
		}

		const shortPositionRows = [];

		for (const shortInfo of currentShorts) {
			shortPositionRows.push(
				<ShortPositionsRow shortInfo={shortInfo} exchangeRates={exchangeRates} />
			);
		}

		return <>{shortPositionRows}</>;
	}

	return <></>;
};

export const NoShortsContainer = styled(GridDivCentered)`
	width: 100%;
	border-radius: 4px;
	grid-template-columns: 1fr auto;
	background-color: ${(props) => props.theme.colors.elderberry};
	padding: 16px 32px;
	margin: 0 auto;
	${media.lessThan('md')`
		justify-items: center;
		grid-template-columns: unset;
		grid-gap: 30px;
	`}
`;

export const Message = styled.div`
	color: ${(props) => props.theme.colors.white};
	font-size: 14px;
	font-family: ${(props) => props.theme.fonts.bold};
	flex-grow: 1;
	text-align: center;
`;

export default ShortPositions;
