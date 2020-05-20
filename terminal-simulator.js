const MOVE_LEFT = "\x1b[D"
const MOVE_RIGHT = "\x1b[C"
const MOVE_UP = "\x1b[A"
const MOVE_DOWN = "\x1b[B"
const MOVE_LINE_START = "\x1bOH"
const MOVE_LINE_START2 = "\x01"
const MOVE_LINE_END = "\x1bOF"
const MOVE_LINE_END2 = "\x05"
const MOVE_WORD_BEFORE = "\x1bb"
const MOVE_WORD_AFTER = "\x1bf"

const PASTE_START = "\x1b[200~"
const PASTE_END = "\x1b[201~"
const NEWLINE = "\r"
const NEWLINE2 = "\n"

const ERASE_TO_END = "\x0b"
const ERASE_UNITIL_PREVIOUS_WHITESPACE = "\x17"
const ERASE_LINE = "\x15"
const CLEAR_SCREEN = "\x1b[2J"

const DELETE_BEFORE = "\x7f"
const DELETE_BEFORE2 = "\b"
const DELETE_AFTER = "\x04"

const TAB = "\t"
const EXIST_C = "\x03"


const STOP_CHARS = new Set([":", " ", "|", "\\", "@", "`"])

const RESET_MOVE_PATTEN = /([\x1b]\[(\d+)?[CD])|[\b]/g

const REMOVE_USELESS_PTY_PATTERN = /([\x1b](\[(\d+)?[Pm])|\x07)/g

function findNextBreakPoint(chars, startCurosr) {
  if (startCurosr == chars.length) {
    return startCurosr
  }


  let isFindNormal = STOP_CHARS.has(chars[startCurosr])

  for (let i = startCurosr; i < chars.length; i++) {
    const currentChar = chars[i]
    if (isFindNormal) {
      if (!STOP_CHARS.has(currentChar)) {
        return i
      }
    } else {
      if (STOP_CHARS.has(currentChar)) {
        isFindNormal = true
        continue
      }
    }

  }

  return chars.length

}

function findPreviousBreakPoint(chars, startCurosr) {
  if (startCurosr == 0) {
    return startCurosr
  }

  if (!STOP_CHARS.has(chars[startCurosr]) && STOP_CHARS.has(chars[startCurosr - 1])) {
    startCurosr--
  }

  let isFindNormal = !STOP_CHARS.has(chars[startCurosr])

  for (let i = startCurosr; i > -1; i--) {
    const currentChar = chars[i]
    if (isFindNormal) {
      if (STOP_CHARS.has(currentChar)) {
        return i + 1
      }
    } else {
      if (!STOP_CHARS.has(currentChar)) {
        isFindNormal = true
        continue
      }
    }

  }

  return 0

}

const PTY_SKIP_CHARS = new Set(["\r"])




class TerminalSimulator {
  constructor() {
    this.cursor = 0
    this.cache = []
    this.isFirstTab = false
    this.isDisableTabCheck = false
    this.isUpAndDown = false
  }

  writePTY(_data) {
    // console.log(_data);
    let data = _data.replace(REMOVE_USELESS_PTY_PATTERN,"")
    if (this.isFirstTab && data.indexOf("\n") == -1) {

      if(data !== ' '){
        this.write(data)
      }
      this.isFirstTab = false
    } else if (this.isUpAndDown) {

      // this.reset()
      const sequences = this.splitSequence(data)
      if(sequences[sequences.length - 1] != ERASE_TO_END){
        sequences.push(ERASE_TO_END)
      }
      // console.log(sequences);
      for(let item of sequences){
        this.write(item)
      }

      this.isUpAndDown = false
    }
  }

  splitSequence(text){
    let cursor = 0
    let result = []
    
    while(cursor < text.length){
      const char = text[cursor]
      if(char === "\x1b"){

        // move 1 step
        if(cursor + 2 < text.length && text[cursor+1] === "[" && (text[cursor+2] === "C" || text[cursor+2] === "D")){
          result.push(text.slice(cursor,cursor+3))
          cursor += 3
        }
        // move multi step
        else if(cursor + 3 < text.length && text[cursor+1] === "[" && (text[cursor+3] === "C" || text[cursor+3] === "D")){
          const count = Number(text[cursor+2])
          const MOVE_LITERAL = "\x1b[" + text[cursor+3]
          for (let i = 0; i < count; i++) {
            result.push(MOVE_LITERAL)
          }

          cursor += 4
        }
        // ignore up and down
        else if(cursor + 2 < text.length && text[cursor+1] === "[" && (text[cursor+2] === "A" || text[cursor+2] === "B")){
          cursor += 3
        }
        // erase to end
        else if(cursor + 2 < text.length && text[cursor+1] === "[" && (text[cursor+2] === "K")){
          result.push(ERASE_TO_END)
          cursor += 3
        }
        else {
          cursor += 1
        }
      }
      else {
        if(!PTY_SKIP_CHARS.has(char)){
          result.push(char)
        }

        cursor+=1
      }
    }

    return result
  }

  write(data) {
    if (data.length === 0) {
      return
    }

    switch (data) {
      case MOVE_UP:
      case MOVE_DOWN:
        this.isUpAndDown = true
        break
      case MOVE_LEFT:
        if (this.cursor > 0) {
          this.cursor -= 1
        }
        break
      case MOVE_RIGHT:
        if (this.cursor < this.cache.length) {
          this.cursor += 1
        }
        break
      case ERASE_UNITIL_PREVIOUS_WHITESPACE:
        let toDeleteLength = 0
        while (this.cursor > 0) {
          this.cursor--
          if(this.cache[this.cursor] === ' '){
            toDeleteLength++
          }
          else {
            break
          }
        }

        while (this.cursor >= 0) {
          if(this.cache[this.cursor] !== ' '){
            toDeleteLength++
            this.cursor--
          }
          else {
            break
          }
        }

        this.cursor++

        this.cache.splice(this.cursor,toDeleteLength)

        break
      case ERASE_TO_END:
        this.cache.splice(this.cursor, this.cache.length - this.cursor)
        break
      case MOVE_LINE_START:
      case MOVE_LINE_START2:
        if (this.cursor > 0) {
          this.cursor = 0
        }
        break
      case MOVE_LINE_END:
      case MOVE_LINE_END2:
        if (this.cursor < this.cache.length) {
          this.cursor = this.cache.length
        }
        break
      case NEWLINE:
      case NEWLINE2:
      case ERASE_LINE:
        this.reset()
        break

      case DELETE_BEFORE:
      case DELETE_BEFORE2:
        if (this.cursor > 0) {
          this.cursor--
          this.cache.splice(this.cursor, 1)
        }
        break
      case DELETE_AFTER:
        if (this.cursor < this.cache.length) {
          this.cache.splice(this.cursor, 1)
        }
        break
      case MOVE_WORD_BEFORE:
        this.cursor = findPreviousBreakPoint(this.cache, this.cursor)
        break
      case MOVE_WORD_AFTER:
        this.cursor = findNextBreakPoint(this.cache, this.cursor)
        break
      case EXIST_C:
        this.reset()
        break
      default:
        if (data === TAB) {
          if(this.isDisableTabCheck){
            console.log(this.isDisableTabCheck);
            return
          }
          if (this.isFirstTab) {
            this.isFirstTab = false
          } else {
            this.isFirstTab = true
          }

          return
        }

        if (data.indexOf(PASTE_START) !== -1) {
          data = data.substr(6, data.length - 12)
        } else if (data.indexOf(MOVE_RIGHT) !== -1) {
          const segments = data.split(MOVE_RIGHT)
          for (let i = 0; i < segments.length; i++) {
            this.write(segments[i])
            if (i !== 0) {
              this.write(MOVE_RIGHT)
            }
          }
          return
        } else if (data.indexOf(MOVE_LEFT) !== -1) {
          const segments = data.split(MOVE_LEFT)
          // console.log(segments);
          for (let i = 0; i < segments.length; i++) {
            this.write(segments[i])
            if (i !== 0) {
              this.write(MOVE_LEFT)
            }
          }
          return
        }

        for (let char of data) {
          this.cache.splice(this.cursor, 0, char)
          this.cursor++
        }

        break
    }
  }

  reset() {
    this.cache = []
    this.cursor = 0
  }

  get text() {
    return this.cache.join("")
  }
}



const MATCH_COMMAND_PATTERN = /^[^ ]+/
const MATCH_SUBCOMMAND_PATTERN = /^[^ ]+\s+([^ ]+)/
const MATCH_LASTWORD_PATTERN = /[^ ]+$/
const TEMPLATE_END_TOKEN = "#END#"


class CommandLineWrapper{
  constructor(terminalSimulator,sendUserData) {
    this.terminalSimulator = terminalSimulator
    this.sendUserData = sendUserData
  }

  get cmd(){
    const match = MATCH_COMMAND_PATTERN.exec(this.terminalSimulator.text)
    if(match){
      return match[0]
    }
    else {
      return ""
    }
  }

  get subcmd(){
    const match = MATCH_SUBCOMMAND_PATTERN.exec(this.terminalSimulator.text)
    if(match){
      return match[1]
    }
    else {
      return ""
    }
  }

  get lastWord(){
    const match = MATCH_LASTWORD_PATTERN.exec(this.terminalSimulator.text.slice(this.cmd.length))
    if(match){
      return match[0]
    }
    else {
      return ""
    }
  }

  get cursorLastWord(){
    const match = MATCH_LASTWORD_PATTERN.exec(this.terminalSimulator.text.slice(this.cmd.length,this.terminalSimulator.cursor))
    if(match){
      return match[0]
    }
    else {
      return ""
    }
  }

  replaceCursorLastWord(text){
    const toDeleteLength = this.cursorLastWord.length
    for(let i=0;i < toDeleteLength;i++){
      this.append(DELETE_BEFORE)
    }
    this.append(text)
  }

  append(text) {

    const texts = text.split(TEMPLATE_END_TOKEN)
    if(texts.length === 1){
      this.sendUserData(text)
    }
    else {
      const result = [texts[0],texts[1]]

      for (let i = 0; i < texts[1].length; i++) {
        result.push(`\x1b[D`)
      }
      this.sendUserData(result.join(""))

    }

  }

  clear(){
    this.sendUserData(ERASE_LINE)
  }

}

exports.TerminalSimulator = TerminalSimulator

exports.CommandLineWrapper = CommandLineWrapper


// console.log(findNextBreakPoint("012:\\567",2))
// console.log(findPreviousBreakPoint("012:\\567",2))

