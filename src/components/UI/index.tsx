import { memo } from 'react'
import { IntroSequence } from './IntroSequence'
import { EnterButton } from './EnterButton'
import { MemoryButton } from './MemoryButton'
import { KeyHint } from './KeyHint'

export const UI = memo(function UI() {
  return (
    <>
      <IntroSequence />
      <EnterButton />
      <MemoryButton />
      {/* <NovelButton /> */}
      <KeyHint />
    </>
  )
})
