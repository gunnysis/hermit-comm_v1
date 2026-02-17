const React = require('react');

const MOCK_INSETS = { top: 0, left: 0, right: 0, bottom: 0 };
const MOCK_FRAME = { x: 0, y: 0, width: 320, height: 640 };

const SafeAreaInsetsContext = React.createContext(MOCK_INSETS);
const SafeAreaFrameContext = React.createContext(MOCK_FRAME);

module.exports = {
  SafeAreaProvider: ({ children }) => children,
  SafeAreaConsumer: ({ children }) => children(MOCK_INSETS),
  SafeAreaInsetsContext,
  SafeAreaFrameContext,
  useSafeAreaInsets: () => MOCK_INSETS,
  useSafeAreaFrame: () => MOCK_FRAME,
  initialWindowMetrics: {
    frame: MOCK_FRAME,
    insets: MOCK_INSETS,
  },
};
