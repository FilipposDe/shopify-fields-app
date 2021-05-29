import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client'
import { ApolloProvider } from '@apollo/client/react'
import {
    offsetLimitPagination,
    relayStylePagination,
} from '@apollo/client/utilities'
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
                        products: relayStylePagination(),
                        // products: {
                        //     keyArgs: false,
                        //     merge(existing = {}, incoming) {
                        //         // {__typename: "ProductConnection", edges: Array(10), pageInfo: {…}}
                        //         const existingEdges = existing?.edges || []
                        //         const incomingEdges = incoming?.edges || []

                        //         const merged = {
                        //             ...existing,
                        //             ...incoming,
                        //             edges: [...existingEdges, ...incomingEdges],
                        //         }
                        //         return merged
                        //     },
                        //     read(
                        //         existing,
                        //         {
                        //             variables: {
                        //                 first: limit = 10,
                        //                 after: afterCursor = '',
                        //                 before: beforeCursor = '',
                        //             },
                        //         }
                        //     ) {
                        //         debugger

                        //         if (!existing) return undefined

                        //         const array = existing?.edges || []

                        //         if (array.length === 0) {
                        //             return {
                        //                 ...existing,
                        //             }
                        //         }

                        //         const isFirstPage =
                        //             !afterCursor && !beforeCursor

                        //         if (isFirstPage) {
                        //             return {
                        //                 ...existing,
                        //                 edges: array.slice(0, limit),
                        //                 pageInfo: {
                        //                     // Since it's the 1st page
                        //                     hasPreviousPage: false,
                        //                     // Either cache has more items, or query says there's more
                        //                     hasNextPage:
                        //                         array.length > limit ||
                        //                         existing.pageInfo.hasNextPage,
                        //                 },
                        //             }
                        //         }

                        //         if (afterCursor) {
                        //             let afterIndex = 0
                        //             for (let i = 0; i < array.length; i++) {
                        //                 if (array[i]?.cursor === afterCursor) {
                        //                     afterIndex = i
                        //                     break
                        //                 }
                        //             }

                        //             const startIndex = afterIndex + 1
                        //             const endIndex = afterIndex + 1 + limit

                        //             const edgesSlice = array.slice(
                        //                 startIndex,
                        //                 endIndex
                        //             )

                        //             const cacheHasMore = array.length > endIndex

                        //             const newPageInfo = {
                        //                 // It's not the first page since there's an item before
                        //                 hasPreviousPage: true,
                        //                 // Cache already has extra items, or latest query says there's more
                        //                 hasNextPage:
                        //                     cacheHasMore ||
                        //                     existing.pageInfo.hasNextPage,
                        //             }

                        //             return {
                        //                 ...existing,
                        //                 edges: edgesSlice,
                        //                 pageInfo: newPageInfo,
                        //             }
                        //         }

                        //         if (beforeCursor) {
                        //             let beforeIndex = limit
                        //             for (let i = 0; i < array.length; i++) {
                        //                 if (array[i]?.cursor === beforeCursor) {
                        //                     beforeIndex = i
                        //                     break
                        //                 }
                        //             }

                        //             const startIndex = beforeIndex - limit
                        //             const endIndex = beforeIndex

                        //             const edgesSlice = array.slice(
                        //                 startIndex,
                        //                 endIndex
                        //             )

                        //             const cacheHasMoreBehind = startIndex > 0

                        //             const newPageInfo = {
                        //                 // It's not the last page since there's an 'after' item we excluded
                        //                 hasNextPage: true,
                        //                 // Cache already has items before, or latest query says there's more(?)
                        //                 hasPreviousPage: cacheHasMoreBehind,
                        //                 //    || existing.pageInfo.hasNextPage,
                        //             }

                        //             return {
                        //                 ...existing,
                        //                 edges: edgesSlice,
                        //                 pageInfo: newPageInfo,
                        //             }
                        //         }

                        //         return existing // && existing.slice(first, )
                        //     },
                        // },
                    },
                },
            },
        }),
    })

    return <ApolloProvider client={client}>{props.children}</ApolloProvider>
}

export default ApolloAppProvider
