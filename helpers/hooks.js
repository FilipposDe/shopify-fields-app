import { gql, useQuery, useLazyQuery, useMutation } from '@apollo/client'
import { useEffect, useState, useContext } from 'react'
import { useAppBridge } from '@shopify/app-bridge-react'
import { FrameContext } from '../components/FrameContext'
import { AppContext } from '../components/AppContext'
import { CustomError, getAppFetch } from './helpers'
import { APP_METAFIELD_NAMESPACE, GENERIC_ERROR_MSG } from './constants'
import useSWR from 'swr'

export default function useDebounceOnChange(value, cb) {
    useEffect(() => {
        const timeout = setTimeout(() => {
            cb()
        }, 500)
        return () => {
            clearTimeout(timeout)
        }
    }, [value])
}

/*******
 *
 *          App Data
 *
 ******/

export function useCreateField() {
    const app = useAppBridge()

    const { globalToast, setGlobalToast } = useContext(FrameContext)
    const { appState } = useContext(AppContext)

    const [error, setError] = useState('')
    const [loading, setLoading] = useState('')

    const createField = async (data) => {
        setLoading(true)
        setError('')

        const customFetch = getAppFetch(app, appState.shop)

        try {
            const res = await customFetch('/api/field', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            })

            setGlobalToast('Saved')
            setLoading(false)

            return res.id
        } catch (e) {
            setError(e instanceof CustomError ? e : GENERIC_ERROR_MSG)
            setLoading(false)
            return
        }
    }

    return { createField, error, loading }
}

export function useEditField() {
    const app = useAppBridge()

    const { appState } = useContext(AppContext)
    const { globalToast, setGlobalToast } = useContext(FrameContext)

    const [error, setError] = useState('')
    const [loading, setLoading] = useState('')

    const editField = async (data, id) => {
        setLoading(true)
        setError('')

        const customFetch = getAppFetch(app, appState.shop)

        try {
            const res = await customFetch(`/api/field/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            })

            setGlobalToast('Saved')
            setLoading(false)

            return res.id
        } catch (e) {
            setError(e instanceof CustomError ? e : GENERIC_ERROR_MSG)
            setLoading(false)
            return
        }
    }

    return { editField, error, loading }
}

export function useAppFields(app, shop) {
    const { data, error } = useSWR('/api/fields', getAppFetch(app, shop, true))

    const loading = !data && !error

    return {
        appFields: data,
        appFieldsLoading: loading,
        appFieldsError: error,
    }
}

/*******
 *
 *          Shopify Data
 *
 *******/

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

    // Current Shopify page's first and last items
    const [cursors, setCursors] = useState({ first: '', last: '' })

    const edges = data?.products?.edges

    const products = edges?.map((edge) => edge.node)

    // Pagination data
    const responseCursors = edges?.map((edge) => edge.cursor)
    const firstCursor = responseCursors?.[0]
    const lastCursor = responseCursors?.[responseCursors?.length - 1]

    const hasNext = data?.products?.pageInfo?.hasNextPage

    useEffect(() => {
        // If new cursors are received, update state
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

    // State is needed for input component
    const [queryValue, setQueryValue] = useState('')

    const [getProducts, { loading, data, error }] = useLazyQuery(SEARCH_QUERY, {
        fetchPolicy: 'network-only',
    })

    useDebounceOnChange(queryValue, () => {
        if (queryValue !== '') getProducts({ variables: { query: queryValue } })
    })

    const search = async (v) => {
        // useDebounceOnChange listens to new value
        setQueryValue(v)
    }

    const productResults = data?.products?.edges?.map((edge) => edge.node)

    return {
        query: queryValue,
        productResults,
        searchLoading: loading,
        searchError: error,
        search,
    }
}

export function useProduct(id) {
    const QUERY = gql`
        query {
            product(id: "gid://shopify/Product/${id}") {
                id
                title 
                metafields(first:250) {
                    edges {
                        node {
                            id
                            key
                            value
                            valueType
                            namespace
                        }
                    }
                }   
            }
        }
    `

    const { data, loading, error, refetch } = useQuery(QUERY, {})

    if (loading || error) {
        return {
            product: data?.product,
            productLoading: loading,
            productError: error,
            refetch,
            initialResponse: data,
        }
    }

    const productData = data?.product

    if (!productData) {
        return {
            product: null,
            productLoading: false,
            productError: null,
            refetch,
            initialResponse: data,
        }
    }

    const metafields = productData?.metafields?.edges
        .map((edge) => edge.node)
        .filter((item) => item.namespace === APP_METAFIELD_NAMESPACE)

    if (!Array.isArray(metafields)) {
        return {
            product: data?.product,
            productLoading: false,
            productError: new Error(GENERIC_ERROR_MSG),
            refetch,
            initialResponse: data,
        }
    }

    if (metafields.length >= 250) {
        // TODO more than 250
        return {
            product: data?.product,
            productLoading: false,
            productError: new Error('Product exceeded number of metafields.'),
            refetch,
            initialResponse: data,
        }
    }

    const productFieldsNormalized = {}
    metafields.forEach((item) => {
        productFieldsNormalized[item.key] = {
            key: item.key,
            value: item.value,
            id: item.id,
            valueType: item.valueType,
        }
    })

    return {
        product: {
            id: productData.id,
            title: productData.title,
            metafieldsNormalized: productFieldsNormalized,
        },
        productLoading: false,
        productError: null,
        refetch,
        initialResponse: data,
    }
}

export function useEditMetafields() {
    const CREATE_MUTATION = gql`
        mutation productUpdate($input: ProductInput!) {
            productUpdate(input: $input) {
                product {
                    metafields(first: 250) {
                        edges {
                            node {
                                namespace
                                key
                                value
                                valueType
                            }
                        }
                    }
                }
            }
        }
    `

    const UPDATE_MUTATION = gql`
        mutation productUpdate($input: ProductInput!) {
            productUpdate(input: $input) {
                product {
                    metafields(first: 250) {
                        edges {
                            node {
                                id
                                value
                            }
                        }
                    }
                }
            }
        }
    `

    const DELETE_MUTATION = gql`
        mutation metafieldDelete($input: MetafieldDeleteInput!) {
            metafieldDelete(input: $input) {
                deletedId
            }
        }
    `

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(false)

    const [update, { error: updateError }] = useMutation(UPDATE_MUTATION)

    const [create, { error: createError }] = useMutation(CREATE_MUTATION)

    const [del, { error: deleteError }] = useMutation(DELETE_MUTATION)

    const updateMetafields = async (args) => {
        setLoading(true)
        try {
            await update(args)
        } catch (error) {
            // TODO error
            console.error(error)
            setError(error)
        }
        setLoading(false)
    }

    const deleteMetafield = async (args) => {
        // Note: needs one request per item
        setLoading(true)
        try {
            await del(args)
        } catch (error) {
            // TODO error
            console.error(error)
            setError(error)
        }
        setLoading(false)
    }

    const createMetafields = async (args) => {
        setLoading(true)
        try {
            await create(args)
        } catch (error) {
            // TODO error
            console.error(error)
            setError(error)
        }
        setLoading(false)
    }

    return {
        updateMetafields,
        createMetafields,
        deleteMetafield,
        error: updateError || createError || deleteError || error,
        loading: loading,
    }
}
