// Try to access electron from process.electronBinding or use process directly
console.log('process.type:', process.type);
console.log('process.versions.electron:', process.versions.electron);

// The built-in electron module should be available as 'electron' but Node resolves to npm package
// Let's try to work around by checking if we're in main process
if (process.type === 'browser') {
  console.log('We are in main process');
} else if (process.type === undefined) {
  console.log('process.type is undefined - might be issue with module resolution');
}
