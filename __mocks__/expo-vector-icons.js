const React = require('react');

const createMockIcon = (name) => {
  const Icon = ({ testID, ...props }) =>
    React.createElement('View', { testID: testID || name, ...props });
  Icon.displayName = name;
  return Icon;
};

const Ionicons = createMockIcon('Ionicons');
const MaterialIcons = createMockIcon('MaterialIcons');
const FontAwesome = createMockIcon('FontAwesome');
const AntDesign = createMockIcon('AntDesign');
const Feather = createMockIcon('Feather');

module.exports = {
  Ionicons,
  MaterialIcons,
  FontAwesome,
  AntDesign,
  Feather,
  createIconSet: () => createMockIcon('Icon'),
  default: { Ionicons, MaterialIcons, FontAwesome, AntDesign, Feather },
};
