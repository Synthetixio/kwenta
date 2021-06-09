import { FC } from 'react';
import styled, { css } from 'styled-components';
import { useTranslation } from 'react-i18next';

import { FlexDiv, TextButton } from 'styles/common';
import { Title } from '../common';

export enum TabLabel {
	YOUR_POSITIONS = 'yourPositions',
	HISTORY = 'history',
}
const MENU_TABS = [
	{ label: 'shorting.history.tabs.yourPositions', key: TabLabel.YOUR_POSITIONS },
	{ label: 'shorting.history.tabs.history', key: TabLabel.HISTORY },
];

type HistoryMenuProps = {
	currentTab: TabLabel;
	onTabChange: (tab: TabLabel) => void;
};

const HistoryMenu: FC<HistoryMenuProps> = ({ currentTab, onTabChange }) => {
	const { t } = useTranslation();
	return (
		<Menu>
			{MENU_TABS.map(({ label, key }) => {
				return (
					<Button onClick={() => onTabChange(key)} isSelected={key === currentTab}>
						<StyledTitle>{t(label)}</StyledTitle>
					</Button>
				);
			})}
		</Menu>
	);
};

const Menu = styled(FlexDiv)`
	border-bottom: 1px solid ${(props) => props.theme.colors.navy};
`;
const StyledTitle = styled(Title)`
	font-size: 12px;
	padding-bottom: 0;
`;
const Button = styled(TextButton)<{ isSelected: boolean }>`
	width: 90px;
	padding-bottom: 10px;
	position: relative;
	color: ${(props) => props.theme.colors.blueberry};
	&:not(:first-child) {
		margin-left: 38px;
	}
	&:hover {
		color: ${(props) => props.theme.colors.white};
	}
	${(props) =>
		props.isSelected &&
		css`
			color: ${(props) => props.theme.colors.white};
			&:after {
				content: '';
				background: ${(props) => props.theme.colors.gold};
				display: block;
				position: absolute;
				height: 2px;
				width: 100%;
				bottom: 0;
				left: 50%;
				transform: translateX(-50%);
			}
		`}
`;

export default HistoryMenu;
