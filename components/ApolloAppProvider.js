import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client'
import { ApolloProvider } from '@apollo/client/react'
import { useAppBridge } from '@shopify/app-bridge-react'
import { fetchWrapper } from '../lib/helpers'

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
