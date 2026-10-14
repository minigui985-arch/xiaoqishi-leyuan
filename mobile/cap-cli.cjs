// 仅在当前 Windows 环境的 os.userInfo() 故障时给 Capacitor CLI 提供用户名。
const os=require('node:os');
const userInfo=os.userInfo;
os.userInfo=function(options){
 try{return userInfo(options)}catch(error){
  if(error.code!=='ERR_SYSTEM_ERROR')throw error;
  return {username:process.env.USERNAME||'user',uid:-1,gid:-1,shell:process.env.COMSPEC||'cmd.exe',homedir:os.homedir()};
 }
};
require('./node_modules/@capacitor/cli/bin/capacitor');
