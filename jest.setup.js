import '@testing-library/jest-dom';

window.matchMedia = (media) => ({
	addListener: () => {},
	removeListener: () => {},
	matches: true,
});

jest.mock('react-optimized-image', () => ({
	__esModule: true,
	Img: () => jest.fn(),
	Svg: () => jest.fn(),
	default: () => jest.fn(),
}));
