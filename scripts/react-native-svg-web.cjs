const React = require('react');

function host(tag) {
  return function Host(props) {
    const {children, ...rest} = props;
    return React.createElement(tag, rest, children);
  };
}

const Svg = host('svg');
const Path = host('path');
const Rect = host('rect');
const G = host('g');
const Circle = host('circle');
const Ellipse = host('ellipse');
const Line = host('line');
const Polygon = host('polygon');
const Polyline = host('polyline');

Svg.Path = Path;
Svg.Rect = Rect;
Svg.G = G;
Svg.Circle = Circle;
Svg.Ellipse = Ellipse;
Svg.Line = Line;
Svg.Polygon = Polygon;
Svg.Polyline = Polyline;
Svg.Svg = Svg;
Svg.default = Svg;
Svg.__esModule = true;
module.exports = Svg;
