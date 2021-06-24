import { getPage } from 'next-page-tester';
import { screen, fireEvent, act } from '@testing-library/react';

test('market', async () => {
	await act(async () => {
		const { render } = await getPage({
			route: '/dashboard',
		});

		render();
	});
	//expect(screen.getByText('From')).toBeInTheDocument();
});
