import { FC } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';

// import TxConfirmationModal from 'sections/shared/modals/TxConfirmationModal';
import { FlexDivCol, FlexDivRow, CapitalizedText, BoldText } from 'styles/common';
import { Short } from 'queries/short/types';
import { formatNumber, formatPercent } from 'utils/formatters/number';
import { formatDateWithTime } from 'utils/formatters/date';
// import synthetix from 'lib/synthetix';
// import Connector from 'containers/Connector';
// import Notify from 'containers/Notify';

interface YourPositionCardProps {
	short: Short;
}

const YourPositionCard: FC<YourPositionCardProps> = ({ short }) => {
	const { t } = useTranslation();
	return (
		<Container>
			<SectionRow>
				<BoldText>{t('shorting.history.manageShort.subtitle')}</BoldText>
				{/* 
				  TODO determine if we really need the close here in which case 
				  we need a lot of code to mange the tx vs adding another subtab in the manage positions section 
				*/}
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
						{t('shorting.history.manageShort.liquidationPrice', {
							asset: short.collateralLocked,
						})}
					</LightFieldText>
					<DataField>
						{formatNumber(
							(short.collateralLockedAmount * short.collateralLockedPrice) /
								(short.synthBorrowedAmount * short.contractData.minCratio)
						)}
					</DataField>
				</FlexDivRow>
				<FlexDivRow>
					<LightFieldText>{t('shorting.history.manageShort.collateralRatio')}</LightFieldText>
					<DataField>
						{formatPercent(
							(short.collateralLockedAmount * short.collateralLockedPrice) /
								(short.synthBorrowedAmount * short.synthBorrowedPrice)
						)}
					</DataField>
				</FlexDivRow>
			</SectionRow>
			<SectionRow>
				<FlexDivRow>
					<LightFieldText>
						{t('shorting.history.manageShort.profitLoss', { asset: short.collateralLocked })}
					</LightFieldText>
					{/* 
				      need to put profit loss here. this is just a placeholder for now
				    */}
					<DataField profitLoss={1}>{formatNumber(1)}</DataField>
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
