import { createContext } from 'react'

export const AppContext = createContext({
    appState: {},
    setAppState: () => {},
})
