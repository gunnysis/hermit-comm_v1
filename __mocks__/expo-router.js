const React = require('react');
const { View } = require('react-native');

const Link = ({ href, children, asChild, ...props }) => {
  const Child = asChild ? React.Children.only(children) : null;
  if (Child) return React.cloneElement(Child, { ...props, href });
  return React.createElement(View, { ...props }, children);
};

module.exports = {
  Link,
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => '/',
  useSegments: () => [],
  useLocalSearchParams: () => ({}),
  useGlobalSearchParams: () => ({}),
};
