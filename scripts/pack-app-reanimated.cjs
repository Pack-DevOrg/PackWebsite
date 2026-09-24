const React = require('react');
const {View} = require('react-native');

const Animated = {
  View,
  createAnimatedComponent(Component) {
    return Component;
  },
};

function useSharedValue(value) {
  return {value};
}

function useAnimatedStyle(factory) {
  return factory();
}

function withTiming(value) {
  return value;
}

function withSequence(...values) {
  return values[values.length - 1];
}

module.exports = {
  default: Animated,
  Animated,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
};
