import { createContext } from 'react'

export const FrameContext = createContext({
    globalToast: {},
    setGlobalToast: () => {},
})
