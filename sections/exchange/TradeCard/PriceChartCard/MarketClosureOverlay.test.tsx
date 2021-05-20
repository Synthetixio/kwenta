import { render, RenderOptions } from '@testing-library/react';
import MarketClosureOverlay from './MarketClosureOverlay';

jest.mock("@tippyjs/react", () => ({
    __esModule: true,
    default: jest.fn(),
  }));

test('check market timer', async () => {
	render(<MarketClosureOverlay />);
});
