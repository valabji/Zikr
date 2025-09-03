const React = require('react');

const mockComponent = (name) => {
  const MockedComponent = React.forwardRef((props, ref) =>
    React.createElement(name, { ...props, ref }, props.children)
  );
  MockedComponent.displayName = `Mocked${name}`;
  return MockedComponent;
};

const Svg = mockComponent('Svg');

module.exports = {
  __esModule: true,
  default: Svg,
  Svg: Svg,
  Circle: mockComponent('Circle'),
  Ellipse: mockComponent('Ellipse'), 
  G: mockComponent('G'),
  Text: mockComponent('Text'),
  TSpan: mockComponent('TSpan'),
  TextPath: mockComponent('TextPath'),
  Path: mockComponent('Path'),
  Polygon: mockComponent('Polygon'),
  Polyline: mockComponent('Polyline'),
  Line: mockComponent('Line'),
  Rect: mockComponent('Rect'),
  Use: mockComponent('Use'),
  Image: mockComponent('Image'),
  Symbol: mockComponent('Symbol'),
  Defs: mockComponent('Defs'),
  LinearGradient: mockComponent('LinearGradient'),
  RadialGradient: mockComponent('RadialGradient'),
  Stop: mockComponent('Stop'),
  ClipPath: mockComponent('ClipPath'),
  Pattern: mockComponent('Pattern'),
  Mask: mockComponent('Mask'),
};
