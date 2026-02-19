const React = require('react');
const { FlatList } = require('react-native');

const FlashList = React.forwardRef((props, ref) =>
  React.createElement(FlatList, { ...props, ref }),
);
FlashList.displayName = 'FlashList';

module.exports = { FlashList };
