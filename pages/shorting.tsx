import { FC } from 'react';
import Head from 'next/head';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';

import ShortingCard from 'sections/shorting/ShortingCard';

import AppLayout from 'sections/shared/Layout/AppLayout';
import { PageContent } from 'styles/common';
import media from 'styles/media';

const Shorting: FC = () => {
	const { t } = useTranslation();

	return (
		<>
			<Head>
				<title>{t('shorting.page-title')}</title>
			</Head>
			<AppLayout>
				<StyledPageContent>
					<ShortingCard />
				</StyledPageContent>
			</AppLayout>
		</>
	);
};

const StyledPageContent = styled(PageContent)`
	padding-top: 55px;
	${media.greaterThan('md')`
		max-width: 680px;
	`}
`;

export default Shorting;
