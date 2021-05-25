import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client'
import { ApolloProvider } from '@apollo/client/react'
import { useAppBridge } from '@shopify/app-bridge-react'
import { authenticatedFetch } from '@shopify/app-bridge-utils'
import { Redirect } from '@shopify/app-bridge/actions'

const fetchWrapper = (app, shop) => {
    const fetchFunction = authenticatedFetch(app)

    return async (uri, options) => {
        const response = await fetchFunction(uri, options)
        const unauthHeader = response.headers.get(
            'X-Shopify-API-Request-Failure-Reauthorize'
        )

        if (unauthHeader === '1') {
            const url = `https://${document.location.hostname}/auth?shop=${shop}`
            Redirect.create(app).dispatch(Redirect.Action.REMOTE, url)
            return null
        }

        return response
    }
}

const ApolloAppProvider = (props) => {
    const app = useAppBridge()

    const httpLink = new HttpLink({
        uri: '/graphql',
        fetch: fetchWrapper(app, props.shop),
        fetchOptions: {
            credentials: 'include',
        },
    })

    const client = new ApolloClient({
        link: httpLink,
        // TODO
        cache: new InMemoryCache(),
    })

    return <ApolloProvider client={client}>{props.children}</ApolloProvider>
}

export default ApolloAppProvider
