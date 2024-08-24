import type { ShikiTransformer } from 'shiki'
import { createCommentNotationTransformer } from '../utils'

export interface TransformerNotationMapOptions {
  classMap?: Record<string, string | string[]>
  /**
   * Class added to the <pre> element when the current code has diff
   */
  classActivePre?: string
}

export function transformerNotationMap(
  options: TransformerNotationMapOptions = {},
  name = '@shikijs/transformers:notation-map',
): ShikiTransformer {
  const {
    classMap = {},
    classActivePre,
  } = options

  return createCommentNotationTransformer(
    name,
    Object.keys(classMap),
    function (namespace, options, _line, _comment, lines, index) {
      const lineNum = options.length > 0 ? Number.parseInt(options, 10) : 1

      lines
        .slice(index, index + lineNum)
        .forEach((line) => {
          this.addClassToHast(line, classMap[namespace])
        })
      if (classActivePre)
        this.addClassToHast(this.pre, classActivePre)
      return true
    },
  )
}
