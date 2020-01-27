const CLIPBOARD_PLACEHOLDER = "#CLIP#"

class SnippetManager {
  constructor(config) {

    this.config = config
  }



  matchAndRun(context){
    // console.log("reach");
    const cmd = context.commandLine.cmd
    const lastWord = context.commandLine.cursorLastWord
    let matchSnippet = null

    if(cmd in this.config){
      const cmdConfig = this.config[cmd]
      const subcmd = context.commandLine.subcmd
      if(cmdConfig.$subcmds && subcmd in cmdConfig.$subcmds){
        const subcmdConfig = cmdConfig.$subcmds[subcmd]

        if(lastWord in subcmdConfig){
          matchSnippet = subcmdConfig[lastWord]
        }

      }
      else if(lastWord in cmdConfig){
        matchSnippet = cmdConfig[lastWord]
      }
    }



    if(!matchSnippet) {
     return false
    }

    if (typeof matchSnippet === "function") {
      matchSnippet(context)
    } else {
      this._runStringSnippet(matchSnippet, context)
    }
    return true
  }

  _runStringSnippet(snippet, context){
    context.commandLine.replaceCursorLastWord(snippet.replace(CLIPBOARD_PLACEHOLDER,context.clipboard.readText))
  }
}


module.exports = {
  SnippetManager
}
