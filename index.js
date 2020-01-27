const {TerminalSimulator,CommandLineWrapper} = require('./terminal-simulator')
const {SnippetManager} = require('./SnippetManager')



SESSION_USER_DATA = "SESSION_USER_DATA"


let _store

function sendSessionData(uid, data, escaped) {
  return ((dispatch, getState) => {

    dispatch({
      type: SESSION_USER_DATA,
      data,
      effect() {
        // If no uid is passed, data is sent to the active session.
        const targetUid = uid || getState().sessions.activeUid;
        rpc.emit('data', {uid: targetUid, data, escaped});
      }
    });
  })(_store.dispatch, _store.getState);
}




let clipboard
let fs
let config


exports.onRendererWindow = (window) => {
  const remote = window.require("electron").remote
  clipboard = remote.clipboard

  // check configPath file exists, if not create it
  fs = window.require("fs")
  const os = window.require("os")
  const path = window.require("path")
  const configPath  = path.join(os.homedir(),".hyper_plugins","hyper-snippet.js")
  if(!fs.existsSync(configPath)){
    fs.writeFileSync(configPath,"module.exports = {}")
    config = {}
  }
  else {
    config = window.require(configPath)
  }
  
}



let terminalSimulator = new TerminalSimulator()
let commandLine = new CommandLineWrapper(terminalSimulator,(data)=>sendSessionData(null,data))



let snippetManager
//   = new SnippetManager({
//   "docker":{
//     "p":"ps -a",
//     "s":"start #CLIP#",
//     $subcmds:{
//       "run":{
//         "p":"-p #END#:",
//         "e":"-e #END#="
//       }
//     }
//   },
//   "cd":{
//     "c":"#CLIP#",
//     "d":({commandLine})=>{
//       commandLine.clear()
//       commandLine.append("test")
//     }
//   },
//   "ionic":{
//     "s":"serve --external",
//     "l":"cordova run ios --livereload-url=#CLIP#"
//   },
//   "ssh":{
//     "jsva":"root@198.162.1.1"
//   }
// })



exports.middleware = store => next => action => {
  if (!_store) {
    _store = store
  }

  if(!snippetManager && config){
    snippetManager = new SnippetManager(config)
  }
  if (action.type === "SESSION_USER_DATA") {
    // console.log("x"+ action.data + "x");
    if(action.data === "\t" && snippetManager.matchAndRun({
      clipboard,
      commandLine
    })){
      return
    }


    terminalSimulator.write(action.data)

  }

  if(action.type === "SESSION_PTY_DATA"){
    terminalSimulator.writePTY(action.data)
    console.log(terminalSimulator.text);
    // console.log(commandLine.cmd, commandLine.lastWord);
  }
  next(action)
}
