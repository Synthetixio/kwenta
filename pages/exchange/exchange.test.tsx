import { getPage } from 'next-page-tester';
import { screen, fireEvent, act } from '@testing-library/react';

test('market', async () => {
	await act(async () => {
		const { render, serverRenderToString } = await getPage({
			route: '/',
		});

		render();
		//console.log(serverRenderToString())
		expect(screen.getByText('Derivatives trading with zero slippage')).toBeInTheDocument();
	});
});
