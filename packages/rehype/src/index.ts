/// <reference types="mdast-util-to-hast" />

import type { LanguageInput, StringLiteralUnion } from 'shiki/core'
import type { BuiltinLanguage, BuiltinTheme } from 'shiki'
import { bundledLanguages, getSingletonHighlighter } from 'shiki'
import type { Plugin } from 'unified'
import type { Root } from 'hast'
import rehypeShikiFromHighlighter from './core'
import type { RehypeShikiCoreOptions } from './core'

export type RehypeShikiOptions = RehypeShikiCoreOptions
  & {
    /**
     * Alias of languages
     * @example { 'my-lang': 'javascript' }
     */
    langAlias?: Record<string, StringLiteralUnion<BuiltinLanguage>>

    /**
     * Language names to include.
     *
     * @default Object.keys(bundledLanguages)
     */
    langs?: Array<LanguageInput | BuiltinLanguage>
  }

const rehypeShiki: Plugin<[RehypeShikiOptions], Root> = function (
  options = {} as RehypeShikiOptions,
) {
  const { langAlias, langs = Object.keys(bundledLanguages), ...rest } = options
  const themeNames = 'themes' in rest ? Object.values(rest.themes) : [rest.theme]

  let getHandler: Promise<any>

  return async (tree) => {
    if (!getHandler) {
      getHandler = getSingletonHighlighter({
        themes: themeNames.filter(Boolean) as BuiltinTheme[],
        langs,
        langAlias,
      })
        .then(highlighter => rehypeShikiFromHighlighter.call(this, highlighter, rest))
    }
    const handler = await getHandler
    return handler!(tree) as Root
  }
}

export default rehypeShiki
