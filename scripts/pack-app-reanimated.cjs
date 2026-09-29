const {View} = require('react-native');

function useSharedValue(value) {
  return {value};
}

function useAnimatedStyle(updater) {
  return updater();
}

function withTiming(value) {
  return value;
}

function withSequence(...values) {
  return values[values.length - 1];
}

const Animated = {
  View,
  createAnimatedComponent(component) {
    return component;
  },
};

module.exports = {
  __esModule: true,
  default: Animated,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
};
