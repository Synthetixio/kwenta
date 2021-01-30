import { FC } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';

import { FlexDivCol, FlexDivRow, CapitalizedText, BoldText } from 'styles/common';
import { ShortRecord } from 'queries/short/types';
import { formatNumber } from 'utils/formatters/number';
import { formatDateWithTime } from 'utils/formatters/date';

interface YourPositionCardProps {
	short: ShortRecord;
}

const YourPositionCard: FC<YourPositionCardProps> = ({ short }) => {
	const { t } = useTranslation();
	return (
		<Container>
			<SectionRow>
				<BoldText>{t('shorting.history.manageShort.subtitle')}</BoldText>
				<RedCapitalized>{t('shorting.history.manageShort.close')}</RedCapitalized>
			</SectionRow>
			<SectionRow>
				<FlexDivRow>
					<LightFieldText>
						{t('shorting.history.manageShort.collateral', { asset: short.collateralLocked })}
					</LightFieldText>
					<DataField>{formatNumber(short.collateralLockedAmount)}</DataField>
				</FlexDivRow>
				<FlexDivRow>
					<LightFieldText>
						{t('shorting.history.manageShort.shorting', { asset: short.synthBorrowed })}
					</LightFieldText>
					<DataField>{formatNumber(short.synthBorrowedAmount)}</DataField>
				</FlexDivRow>
			</SectionRow>
			<SectionRow>
				<FlexDivRow>
					<LightFieldText>
						{t('shorting.history.manageShort.liquidationPrice', { asset: short.collateralLocked })}
					</LightFieldText>
					<DataField>
						{formatNumber(
							((short.synthBorrowedAmount * short.synthPrice) / short.contractData.minCratio) *
								short.collateralPrice
						)}
					</DataField>
				</FlexDivRow>
				<FlexDivRow>
					<LightFieldText>{t('shorting.history.manageShort.collateralRatio')}</LightFieldText>
					<DataField>
						{formatNumber(
							(short.collateralLockedAmount * short.collateralPrice) /
								(short.synthBorrowedAmount * short.synthPrice)
						)}
					</DataField>
				</FlexDivRow>
			</SectionRow>
			<SectionRow>
				<FlexDivRow>
					<LightFieldText>
						{t('shorting.history.manageShort.profitLoss', { asset: short.collateralLocked })}
					</LightFieldText>
					<DataField profitLoss={short.profitLoss}>{formatNumber(short.profitLoss)}</DataField>
				</FlexDivRow>
				<FlexDivRow>
					<LightFieldText>{t('shorting.history.manageShort.date')}</LightFieldText>
					<DataField>{formatDateWithTime(short.createdAt)}</DataField>
				</FlexDivRow>
			</SectionRow>
		</Container>
	);
};

const Container = styled(FlexDivCol)`
	font-family: ${(props) => props.theme.fonts.mono};
	border-radius: 4px;
	background-color: ${(props) => props.theme.colors.elderberry};
	width: 100%;
`;

const SectionRow = styled(FlexDivRow)`
	height: 25px;
	padding: 4px;
	border-bottom: 0.5px solid ${(props) => props.theme.colors.navy};
	&:last-child {
		border-bottom: none;
	}
`;

const LightFieldText = styled.div`
	color: ${(props) => props.theme.colors.blueberry};
`;

const DataField = styled.div<{ profitLoss?: number }>`
	color: ${(props) =>
		props.profitLoss != null
			? props.profitLoss >= 0
				? props.theme.colors.green
				: props.theme.colors.red
			: props.theme.colors.white};
`;

const RedCapitalized = styled(CapitalizedText)`
	background-color: ${(props) => props.theme.colors.red};
`;

export default YourPositionCard;
