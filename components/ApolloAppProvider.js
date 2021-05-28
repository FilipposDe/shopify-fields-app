import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client'
import { ApolloProvider } from '@apollo/client/react'
import { offsetLimitPagination } from '@apollo/client/utilities'
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
        // TODO + retry with apollo link
        cache: new InMemoryCache({
            typePolicies: {
                Query: {
                    fields: {
                        products: {
                            keyArgs: false,
                            merge(existing = {}, incoming) {
                                console.log('merge!')

                                // const existingProducts = existing?.edges || []
                                // ?.map((edge) => edge.node) ||
                                // []

                                // const incomingCursors = incoming?.edges?.map(
                                //     (edge) => edge.cursor
                                // )

                                // {__typename: "ProductConnection", edges: Array(10), pageInfo: {…}}

                                const existingEdges = existing?.edges || []
                                const incomingEdges = incoming?.edges || []

                                const merged = {
                                    ...existing,
                                    ...incoming,
                                    edges: [...existingEdges, ...incomingEdges],
                                }
                                // const incomingProducts = incoming?.edges || []
                                // ?.map((edge) => edge.node) ||
                                // []

                                // console.log(existingProducts)
                                // console.log(incoming)
                                // console.log(incomingProducts)
                                return merged
                                // return [
                                //     ...existingProducts,
                                //     ...incomingProducts,
                                // ]
                            },
                            // read(
                            //     existing
                            //     // { args: { first = 0, after = '', before = '' } }
                            // ) {
                            //     // existing.find((item, index) => index.cursor )
                            //     console.log('read!')
                            //     console.log(existing)
                            //     return existing // && existing.slice(first, )
                            // },
                        },
                    },
                },
            },
        }),
    })

    return <ApolloProvider client={client}>{props.children}</ApolloProvider>
}

export default ApolloAppProvider
