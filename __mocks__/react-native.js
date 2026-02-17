// React Native mock for Jest (node environment)
const React = require('react');

const View = ({ children, ...props }) => React.createElement('View', props, children);
const Text = ({ children, ...props }) => React.createElement('Text', props, children);
const TouchableOpacity = ({ children, onPress, disabled, ...props }) =>
  React.createElement('TouchableOpacity', {
    ...props,
    disabled,
    onPress: disabled ? undefined : onPress,
  }, children);
const Pressable = ({ children, onPress, ...props }) =>
  React.createElement('Pressable', { ...props, onPress }, children);
const ScrollView = ({ children, ...props }) => React.createElement('ScrollView', props, children);
const TextInput = (props) => React.createElement('TextInput', props);
const ActivityIndicator = (props) => React.createElement('ActivityIndicator', props);
const FlatList = ({ data = [], renderItem, keyExtractor, ListHeaderComponent, ListFooterComponent, ...props }) => {
  const Header = typeof ListHeaderComponent === 'function' ? React.createElement(ListHeaderComponent) : ListHeaderComponent;
  const Footer = typeof ListFooterComponent === 'function' ? React.createElement(ListFooterComponent) : ListFooterComponent;
  return React.createElement(
    View,
    { ...props, testID: 'flat-list' },
    Header,
    data.slice(0, 20).map((item, index) => {
      const key = keyExtractor ? keyExtractor(item, index) : item?.id ?? index;
      return React.createElement(View, { key }, renderItem ? renderItem({ item, index }) : null);
    }),
    Footer
  );
};
const RefreshControl = (props) => React.createElement('RefreshControl', props);
const KeyboardAvoidingView = ({ children, ...props }) =>
  React.createElement('KeyboardAvoidingView', props, children);

module.exports = {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  ScrollView,
  TextInput,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  KeyboardAvoidingView,
  StyleSheet: {
    create: (styles) => styles,
    flatten: (style) => (Array.isArray(style) ? Object.assign({}, ...style) : style || {}),
  },
  Platform: {
    OS: 'android',
    select: (config) => (config.android !== undefined ? config.android : config.default),
  },
  Easing: {
    linear: () => {},
    ease: () => {},
    in: (e) => e,
    out: (e) => e,
    inOut: (e) => e,
  },
};
