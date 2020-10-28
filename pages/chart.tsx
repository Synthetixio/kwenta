import Head from 'next/head';
import { useTranslation } from 'react-i18next';

import AppLayout from 'sections/shared/Layout/AppLayout';

import dynamic from 'next/dynamic';

const ChartComp = dynamic(() => import('../sections/chart'), { ssr: false });

const Chart = () => {
	const { t } = useTranslation();

	return (
		<>
			<Head>
				<title>{t('not-found.page-title')}</title>
			</Head>
			<AppLayout>
				<ChartComp />
			</AppLayout>
		</>
	);
};

export default Chart;
