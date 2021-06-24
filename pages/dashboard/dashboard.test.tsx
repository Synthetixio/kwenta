import { getPage } from 'next-page-tester';
import { screen, act } from '@testing-library/react';

test('render dashboard', async () => {
	await act(async () => {
		const { render } = await getPage({
			route: '/dashboard',
		});
		render(); //Not ideal currently double rendering
	});

	expect(screen.getAllByText('Learn How it Works')[0]).toBeInTheDocument();
});
