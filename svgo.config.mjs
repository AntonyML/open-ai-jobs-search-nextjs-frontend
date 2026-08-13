const svgoConfig = {
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

export default svgoConfig
