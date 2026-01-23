const { app, BrowserWindow } = require('electron');
console.log('app type:', typeof app);
console.log('app.whenReady:', typeof app?.whenReady);

if (app && app.whenReady) {
  app.whenReady().then(() => {
    console.log('Electron app is ready!');
    app.quit();
  });
} else {
  console.log('ERROR: app is not available');
  process.exit(1);
}
