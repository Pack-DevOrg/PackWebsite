function useNavigation() {
  return {
    goBack() {
      return undefined;
    },
  };
}

function useFocusEffect(effect) {
  if (typeof effect === 'function') {
    const cleanup = effect();
    if (typeof cleanup === 'function') {
      cleanup();
    }
  }
}

module.exports = {useNavigation, useFocusEffect};
