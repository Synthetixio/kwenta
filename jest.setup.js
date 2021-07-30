import '@testing-library/jest-dom';
import crypto from 'crypto';

window.matchMedia = (media) => {
	return {
		addListener: () => {},
		removeListener: () => {},
		matches: media === '(min-width:1151px) and (max-width:1300px)', // TODO: find a less brittle way to tell @artsy/fresnel to render only desktop
	};
};

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
		Svg: (test) => React.createElement('span', null, JSON.stringify(test)),
		default: () => React.Fragment,
	};
});

jest.mock('bnc-onboard', () => {
	return  {
		__esModule: true,
		default: () => jest.fn()
	}
})

jest.mock('bnc-notify', () => {
	return  {
		__esModule: true,
		default: () => jest.fn()
	}
})
