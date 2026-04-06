/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production'

const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  // GitHub Pages: deploy under /hydra_story_maker/
  basePath: isProd ? '/hydra_story_maker' : '',
  assetPrefix: isProd ? '/hydra_story_maker/' : '',
}

module.exports = nextConfig
