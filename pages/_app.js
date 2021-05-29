import { Provider, useAppBridge } from '@shopify/app-bridge-react'
import '@shopify/polaris/dist/styles.css'
import translations from '@shopify/polaris/locales/en.json'
import {
    AppProvider as PolarisProvider,
    Frame,
    Navigation,
    TopBar,
    Toast,
} from '@shopify/polaris'
import ApolloAppProvider from '../components/ApolloAppProvider'
import ClientRouter from '../components/ClientRouter'
import { Redirect, AppLink, NavigationMenu } from '@shopify/app-bridge/actions'
import '../static/custom.css'
import { createContext, useState } from 'react'
import { FrameContext } from '../components/FrameContext'

function MyApp(props) {
    const { Component, pageProps, shopOrigin } = props

    const [appState, setAppState] = useState({ toast: '', shop: shopOrigin })
    const contextValue = { appState, setAppState }

    const appBridgeConfig = {
        apiKey: API_KEY,
        shopOrigin: shopOrigin,
        forceRedirect: true,
    }

    return (
        <PolarisProvider i18n={translations}>
            <Provider config={appBridgeConfig}>
                <ApolloAppProvider shop={shopOrigin}>
                    <FrameContext.Provider value={contextValue}>
                        <Frame>
                            {appState.toast && (
                                <Toast
                                    content={appState.toast}
                                    onDismiss={() =>
                                        setAppState({
                                            ...appState,
                                            toast: '',
                                        })
                                    }
                                />
                            )}
                            <ClientRouter />
                            <Component {...pageProps} />
                        </Frame>
                    </FrameContext.Provider>
                </ApolloAppProvider>
            </Provider>
        </PolarisProvider>
    )
}

MyApp.getInitialProps = async ({ ctx }) => {
    return {
        shopOrigin: ctx.query.shop,
    }
}

export default MyApp
