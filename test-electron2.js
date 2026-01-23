const electron = require('electron');
console.log('electron module:', electron);
console.log('type:', typeof electron);
console.log('constructor:', electron?.constructor?.name);
if (typeof electron === 'string') {
  console.log('electron is a path string:', electron);
}
