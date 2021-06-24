import '@testing-library/jest-dom';
import crypto from 'crypto';

window.matchMedia = (media) => ({
	addListener: () => {},
	removeListener: () => {},
	matches: true,
});

Object.defineProperty(global.self, 'crypto', {
	value: {
		getRandomValues: (arr) => crypto.randomBytes(arr.length),
	},
});

jest.mock('react-optimized-image', () => {
	const React = require('react'); // React must be hoisted with this mock
	return {
		__esModule: true,
		Img: () => React.Fragment,
		Svg: () => React.Fragment,
		default: () => React.Fragment,
	};
});
