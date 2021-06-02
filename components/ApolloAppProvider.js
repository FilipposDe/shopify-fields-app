import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client'
import { ApolloProvider } from '@apollo/client/react'
import { relayStylePagination } from '@apollo/client/utilities'
import { useAppBridge } from '@shopify/app-bridge-react'
import { getAppFetch } from '../helpers/helpers'

const ApolloAppProvider = (props) => {
    const app = useAppBridge()

    const httpLink = new HttpLink({
        uri: '/graphql',
        fetch: getAppFetch(app, props.shop),
        fetchOptions: {
            credentials: 'include',
        },
    })

    const client = new ApolloClient({
        link: httpLink,
        cache: new InMemoryCache({
            typePolicies: {
                Query: {
                    fields: {
                        products: {
                            ...relayStylePagination(),
                            keyArgs: ['query'],
                        },
                    },
                },
            },
        }),
    })

    return <ApolloProvider client={client}>{props.children}</ApolloProvider>
}

export default ApolloAppProvider
