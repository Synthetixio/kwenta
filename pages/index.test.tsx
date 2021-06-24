import { getPage } from 'next-page-tester';
import { screen, act } from '@testing-library/react';

test('Render homepage', async () => {
	await act(async () => {
		const { render } = await getPage({
			route: '/',
		});

		render();
		expect(screen.getByText('Derivatives trading with zero slippage')).toBeInTheDocument();
	});
});
