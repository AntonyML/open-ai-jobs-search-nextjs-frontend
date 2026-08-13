/** @type {import('svgo').Config} */
export default {
  multipass: true,
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          removeViewBox: false,
          cleanupIds: false,
        },
      },
    },
    'removeDimensions',
    'removeXMLNS',
    'removeScriptElement',
    'sortAttrs',
  ],
}
