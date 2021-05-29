import { gql, useQuery, useLazyQuery } from '@apollo/client'
import { useEffect, useState } from 'react'

export function useAllProducts() {
    const QUERY = gql`
        query Products($first: Int!, $after: String, $before: String) {
            products(first: $first, after: $after, before: $before) {
                edges {
                    cursor
                    node {
                        id
                        title
                        images(first: 1) {
                            edges {
                                node {
                                    originalSrc
                                    altText
                                }
                            }
                        }
                    }
                }
                pageInfo {
                    hasNextPage
                    hasPreviousPage
                }
            }
        }
    `

    const { data, loading, error, fetchMore } = useQuery(QUERY, {
        variables: {
            first: 10,
        },
    })

    const [cursors, setCursors] = useState({ first: '', last: '' })

    const products = data?.products?.edges?.map((edge) => edge.node)

    const responseCursors = data?.products?.edges?.map((edge) => edge.cursor)
    const firstCursor = responseCursors?.[0]
    const lastCursor = responseCursors?.[responseCursors?.length - 1]
    // const hasPreviousPage = data?.products?.pageInfo?.hasPreviousPage
    const hasNext = data?.products?.pageInfo?.hasNextPage

    useEffect(() => {
        setCursors({ last: lastCursor || null, first: firstCursor || null })
    }, [firstCursor, lastCursor])

    const fetchNext = () => {
        const variables = { first: 10 }
        if (cursors.last) {
            variables['after'] = cursors.last
        }
        fetchMore({ variables })
    }

    return { products, loading, error, fetchNext, hasNext }
}

export function useSearchProducts() {
    const [queryValue, setQueryValue] = useState('')

    const SEARCH_QUERY = gql`
        query ($query: String) {
            products(first: 200, query: $query) {
                edges {
                    node {
                        id
                        title
                        images(first: 1) {
                            edges {
                                node {
                                    originalSrc
                                    altText
                                }
                            }
                        }
                    }
                }
            }
        }
    `

    const [getProducts, { loading, data, error }] = useLazyQuery(SEARCH_QUERY, {
        fetchPolicy: 'network-only',
    })

    const search = async (v) => {
        setQueryValue(v)
        if (v !== '') return getProducts({ variables: { query: v } })
    }

    // TODO extra pages
    const productResults = data?.products?.edges?.map((edge) => edge.node)

    return {
        query: queryValue,
        productResults,
        searchLoading: loading,
        searchError: error,
        search,
    }
}
