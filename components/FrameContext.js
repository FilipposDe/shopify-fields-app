import { createContext } from 'react'

export const FrameContext = createContext({
    appState: {},
    setAppState: () => {},
})
