// next.config.js

module.exports = {
	webpack: (config) => {
		config.resolve.mainFields = ['module', 'browser', 'main'];
		return config;
	},
	trailingSlash: !!process.env.NEXT_PUBLIC_DISABLE_PRETTY_URLS,
	exportPathMap: function (defaultPathMap) {
		return {
			...defaultPathMap,
			'/dashboard': {
				page: '/dashboard/[[...tab]]',
			},
			'/exchange': {
				page: '/exchange/[[...market]]',
			},
		};
	},
};
