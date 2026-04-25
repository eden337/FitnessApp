// mobx-react-lite imports react-dom for unstable_batchedUpdates on the web.
// On RN we batch via react-native, so this no-op shim is enough for Jest.
module.exports = {
  unstable_batchedUpdates: (fn) => fn(),
};
