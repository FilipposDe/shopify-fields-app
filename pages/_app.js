import { Provider, useAppBridge } from '@shopify/app-bridge-react'
import '@shopify/polaris/dist/styles.css'
import translations from '@shopify/polaris/locales/en.json'
import {
    AppProvider as PolarisProvider,
    Frame,
    Navigation,
    TopBar,
} from '@shopify/polaris'
import ApolloAppProvider from '../components/ApolloAppProvider'
import ClientRouter from '../components/ClientRouter'
import { Redirect, AppLink, NavigationMenu } from '@shopify/app-bridge/actions'
import '../static/custom.css'

function MyApp(props) {
    const { Component, pageProps, shopOrigin } = props

    const appBridgeConfig = {
        apiKey: API_KEY,
        shopOrigin: shopOrigin,
        forceRedirect: true,
    }

    return (
        <PolarisProvider i18n={translations}>
            <Provider config={appBridgeConfig}>
                <ApolloAppProvider shop={shopOrigin}>
                    <Frame>
                        <ClientRouter />
                        <Component {...pageProps} />
                    </Frame>
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

// function W(props) {

//   const app = useAppBridge()

//   const itemsLink = AppLink.create(app, {
//     label: 'Products',
//     destination: '/',
//   });

//   const settingsLink = AppLink.create(app, {
//     label: 'Fields',
//     destination: '/fields-list',
//   });

//   const navigationMenu = NavigationMenu.create(app, {
//     items: [itemsLink, settingsLink],
//     active: itemsLink,
//   });

//   console.log(`navigationMenu`, navigationMenu)

//   return (
//     <>
//       { props.children }
//     </>
//   )
// }
