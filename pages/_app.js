import { Provider } from '@shopify/app-bridge-react'
import '@shopify/polaris/dist/styles.css'
import translations from '@shopify/polaris/locales/en.json'
import { AppProvider as PolarisProvider, Frame, Toast } from '@shopify/polaris'
import ApolloAppProvider from '../components/ApolloAppProvider'
import ClientRouter from '../components/ClientRouter'
import '../public/custom.css'
import { useState } from 'react'
import { FrameContext } from '../components/FrameContext'
import { AppContext } from '../components/AppContext'

function MyApp(props) {
    const { Component, pageProps, shopOrigin } = props

    const [appState, setAppState] = useState({ shop: shopOrigin })
    const appContextValue = { appState, setAppState }

    const [globalToast, setGlobalToast] = useState('')
    const frameContextValue = { globalToast, setGlobalToast }

    const appBridgeConfig = {
        apiKey: API_KEY,
        shopOrigin: shopOrigin,
        forceRedirect: true,
    }

    return (
        <PolarisProvider i18n={translations}>
            <Provider config={appBridgeConfig}>
                <ApolloAppProvider shop={shopOrigin}>
                    <AppContext.Provider value={appContextValue}>
                        <FrameContext.Provider value={frameContextValue}>
                            <Frame>
                                <ClientRouter />
                                {globalToast && (
                                    <Toast
                                        content={globalToast}
                                        onDismiss={() => setGlobalToast('')}
                                    />
                                )}
                                <Component {...pageProps} />
                            </Frame>
                        </FrameContext.Provider>
                    </AppContext.Provider>
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
