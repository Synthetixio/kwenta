import { getPage } from 'next-page-tester';
import { screen, act } from '@testing-library/react';

test('render dashboard', async () => {
	await act(async () => {
		const { render } = await getPage({
			route: '/dashboard',
		});
		render(); //Not ideal currently double rendering
	});
	expect(screen.getByText('Learn How it Works')).toBeInTheDocument();
});
