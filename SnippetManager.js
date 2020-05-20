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


function common(strings) {
  var first = strings[0] || '';
  var commonLength = first.length

  for (var i = 1; i < strings.length; ++i) {
    for (var j = 0; j < commonLength; ++j) {
      if (strings[i].charAt(j) !== first.charAt(j)) {
        commonLength = j
        break
      }
    }
  }

  return first.slice(0, commonLength)
}


class PrefixMatcher {
  constructor(config) {
    this.prefixIndex = {}
    Object.keys(config).forEach((prefix)=>{
      if(prefix.startsWith("$")){
        const subConfigs = config[prefix]
        if(prefix === "$subcmds"){
          for(let key of Object.keys(subConfigs)){
            this.prefixIndex[key] = new PrefixMatcher(subConfigs[key])
          }
        }
      }
      else {
        this.prefixIndex[prefix] = config[prefix]
      }

    })
  }

  matchPrefix(text){
    const candidates = Object.keys(this.prefixIndex).filter(x=>x.startsWith(text))
    const commonPrefix = common(candidates)
    return {
      candidates,
      commonPrefix
    }
  }


}


module.exports = {
  SnippetManager
}
