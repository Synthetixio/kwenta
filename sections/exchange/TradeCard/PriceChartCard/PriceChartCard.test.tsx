/*import * as React from 'react';


import { AppProps } from 'next/app';
import Head from 'next/head';
import { RecoilRoot } from 'recoil';
import { useTranslation } from 'react-i18next';
import { ReactQueryCacheProvider, QueryCache } from 'react-query';

import { ThemeProvider } from 'styled-components';
import { MediaContextProvider } from 'styles/media';

import { DEFAULT_REQUEST_REFRESH_INTERVAL } from 'constants/defaults';

import WithAppContainers from 'containers';
import theme from 'styles/theme';

import { ReactQueryDevtools } from 'react-query-devtools';

import SystemStatus from 'sections/shared/SystemStatus';

import 'styles/main.css';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import '@reach/dialog/styles.css';
import '@reach/tabs/styles.css';
import '@reach/accordion/styles.css';
import 'tippy.js/dist/tippy.css';

import '../i18n';

import Layout from 'sections/shared/Layout';

const queryCache = new QueryCache({
	defaultConfig: {
		queries: {
			refetchInterval: DEFAULT_REQUEST_REFRESH_INTERVAL,
		},
	},
});

const AllTheProviders= ({ children }: any) => {
  return (
    <ThemeProvider theme={theme}>
    <RecoilRoot>
        <WithAppContainers>
            <MediaContextProvider>
                <ReactQueryCacheProvider queryCache={queryCache}>
                    <Layout>
                        <SystemStatus>
                            {children}
                        </SystemStatus>
                    </Layout>
                    <ReactQueryDevtools />
                </ReactQueryCacheProvider>
            </MediaContextProvider>
        </WithAppContainers>
    </RecoilRoot>
</ThemeProvider>
  )
}

const customRender = (
  ui: any,
  options?: Omit<RenderOptions, 'queries'>
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'

//export { customRender as render }

jest.mock('node_modules/@synthetixio/contracts-interface/node_modules/@ethersproject/signing-key', () => {
    return () => {};
});

jest.mock('node_modules/@ethersproject/signing-key', () => {
    return () => {};
});

jest.mock('@tippyjs/react', () => {
    return () => {};
})

jest.mock('react-query', () => {
    return () => {};
})

jest.mock('sections/shared/SystemStatus/SystemStatus.tsx', () => {
    return () => {};
})

import { render, RenderOptions } from '@testing-library/react';
import ChartCard from './PriceChartCard';
import { SYNTHS_MAP } from 'constants/currency';


test('check market timer', async () => {
	customRender(<ChartCard side={'base'} currencyKey={SYNTHS_MAP.sTSLA} priceRate={1} />);
});
*/