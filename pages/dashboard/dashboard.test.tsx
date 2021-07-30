import { getPage } from 'next-page-tester';
import { screen, act, fireEvent } from '@testing-library/react';

describe('Dashboard Page', () => {
	beforeEach(() => {
		return act(async () => {
			const { render } = await getPage({
				route: '/dashboard',
			});
			render();
		});
	});

	test('render dashboard', (done) => {
		expect(screen.getByText('Learn How it Works')).toBeInTheDocument();
		done();
	});

	test('learn more modal', async () => {
		fireEvent(
			(await screen.findAllByText('Learn More'))[0], //First instance of connect wallet button
			new MouseEvent('click', {
				bubbles: true,
				cancelable: true,
			})
		);

		expect(await screen.findByText('Start trading in just 3 steps')).toBeInTheDocument();
	});
});
