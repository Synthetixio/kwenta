import { getPage } from 'next-page-tester';
import { screen, fireEvent } from '@testing-library/react';

test('market', async () => {
	//render(<ExchangePage />, { wrapper: WithAppContainers });
	//render(<div>H World</div>);
	//render(<Test></Test>);
	const { render } = await getPage({
		route: '/',
	});

	render();
	screen.debug();
	console.log(window.innerWidth);
	//expect(screen.getByText('From')).toBeInTheDocument();
});
