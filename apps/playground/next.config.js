/** @type {import('next').NextConfig} */
const nextConfig = {
	cacheComponents: true,
	partialPrefetching: true,
	experimental: {
		authInterrupts: true,
		turbopackFileSystemCacheForDev: true,
		useOffline: true,
	},
};

module.exports = nextConfig;
