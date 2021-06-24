import '@testing-library/jest-dom';
import crypto from 'crypto';

window.matchMedia = (media) => ({
	addListener: () => {},
	removeListener: () => {},
	matches: true,
});

Object.defineProperty(global.self, 'crypto', {
    value: {
      getRandomValues: arr => crypto.randomBytes(arr.length)
    }
  });

jest.mock('react-optimized-image', () => ({
	__esModule: true,
	Img: () => jest.fn(),
	Svg: () => jest.fn(),
	default: () => jest.fn(),
}));
