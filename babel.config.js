module.exports = function (api) {
  const isTest = api.env('test');
  api.cache(true);

  // Jest: NativeWind babel 제외 (react-native-worklets 미설치로 인한 에러 방지)
  if (isTest) {
    return {
      presets: ['babel-preset-expo'],
    };
  }

  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
  };
};
