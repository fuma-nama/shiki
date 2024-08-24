import type { Element, Text } from 'hast'
import type { ShikiTransformer, ShikiTransformerContext } from 'shiki'

// TODO: Maybe we can do something to match comments depending on the language?
// e.g. `-- SQL comment` shouldn't be allowed in JavaScript

/**
 * Regex that matches code comments
 */
const regex = /((?:\/\/|\/\*|<!--|[#"']|--|%{1,2}|;{1,2})\s*)(\S.*?\S)(\s*-->|\s*\*\/|$)/

/**
 * match the [!code ...] notation syntax
 */
const notationRegex = /\[!code (.+?)\]/g

/**
 * When a current notation exists, the notation transformers will only impact the current line, even if the line has only one comment left
 */
const currentNotation = '[!code current]'

/**
 * Create a transformer to process comment notations
 *
 * @param name transformer name
 * @param namespaces allowed notation namespaces
 * @param onMatch function to be called when found a comment in code, remove the comment node if returns `true`.
 * @param removeEmptyLines remove empty lines below if matched
 */
export function createCommentNotationTransformer(
  name: string,
  namespaces: string[],
  onMatch: (
    this: ShikiTransformerContext,
    namespace: string,
    options: string,
    line: Element,
    commentNode: Element,
    lines: Element[],
    lineIdx: number,
  ) => boolean,
): ShikiTransformer {
  return {
    name,
    code(code) {
      const lines = code.children.filter(i => i.type === 'element') as Element[]
      const linesToRemove: (Element | Text)[] = []

      /**
       * Replace notations inside comment
       */
      const replaceComment = (line: Element, comment: Element, lineIdx: number, text: string): string => {
        return text.replace(notationRegex, (str, notationText: string) => {
          const sep = notationText.indexOf(':')
          const namespace = sep === -1 ? notationText : notationText.slice(0, sep)
          const options = sep === -1 ? '' : notationText.slice(sep + 1)

          if (!namespaces.includes(namespace))
            return str
          const isMatched = onMatch.call(this, namespace, options, line, comment, lines, lineIdx)

          return isMatched ? '' : str
        })
      }

      lines.forEach((line, lineIdx) => {
        // comment should be at the end of line (last token)
        const comment = line.children.findLast(i => i.type === 'element') as Element | undefined

        if (!comment || comment.children.length === 0)
          return
        const text = comment.children[0]
        if (text.type !== 'text' || text.value.trim().length === 0)
          return

        let removeEmptyLine = true
        const replaced = text.value.replace(regex, (_, prefix: string, content: string, end: string) => {
          // take the next line if the current line has no other tokens
          const isCurrent = content.includes(currentNotation) || line.children.length > 1
          const result = replaceComment(line, comment, isCurrent ? lineIdx : lineIdx + 1, content).trim()

          if (isCurrent)
            removeEmptyLine = false
          // remove it if the comment becomes empty
          if (result.length === 0 || result === currentNotation)
            return ''

          return prefix + result + end
        })

        // update the original node
        if (replaced.trim().length > 0) {
          text.value = replaced
          return
        }

        line.children.splice(line.children.indexOf(comment), 1)

        if (removeEmptyLine && line.children.length === 0) {
          linesToRemove.push(line)
        }
      })

      for (const line of linesToRemove)
        code.children.splice(code.children.indexOf(line), 1)
    },
  }
}
