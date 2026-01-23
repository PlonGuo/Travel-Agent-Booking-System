const{app}=require("electron");console.log("type:",process.type,"app:",typeof app);app.whenReady().then(()=>{console.log("ready\!");app.quit()});
