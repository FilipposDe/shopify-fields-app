import {
    Button,
    Card,
    Checkbox,
    ChoiceList,
    Form,
    FormLayout,
    Heading,
    Layout,
    Page,
    TextField,
    Loading,
    Stack,
} from '@shopify/polaris'
import { useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useAppBridge } from '@shopify/app-bridge-react'
import { Redirect } from '@shopify/app-bridge/actions'
import { gql, useMutation, useQuery } from '@apollo/client'
import { APP_METAFIELD_NAMESPACE } from '../../lib/constants'
import { FrameContext } from '../../components/FrameContext'
import useSWR from 'swr'
import { fetchWrapper } from '../../lib/helpers'

function useProduct(id) {
    const QUERY = gql`
        query {
            product(id: "gid://shopify/Product/${id}") {
                id
                title    
            }
        }
    `

    const { data, loading, error } = useQuery(QUERY)

    if (loading || error) {
        return {
            product: null,
            productLoading: loading,
            productError: error,
        }
    }

    const productData = data?.product

    if (!productData) {
        return {
            product: null,
            productLoading: false,
            productError: null,
        }
    }

    return {
        product: {
            id: productData.id,
            title: productData.title,
        },
        productLoading: false,
        productError: null,
    }
}

function useShopifyMetafields(id) {
    const QUERY = gql`
        query {
            product(id: "gid://shopify/Product/${id}") {
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

    const { data, loading, error, refetch } = useQuery(QUERY)

    if (loading || error) {
        return {
            metafields: null,
            metafieldsLoading: loading,
            metafieldsError: error,
            refetchMetafields: refetch,
        }
    }

    const metafields = data?.product.metafields.edges
        .map((edge) => edge.node)
        .filter((item) => item.namespace === APP_METAFIELD_NAMESPACE)

    if (!Array.isArray(metafields)) {
        return {
            metafields: null,
            metafieldsLoading: false,
            metafieldsError: null,
            refetchMetafields: refetch,
        }
    }

    if (metafields.length >= 250) {
        return {
            metafields: null,
            metafieldsLoading: false,
            metafieldsError: {
                error: 'Exceeded number of metafields, some of them might not be visible.',
            },
            refetchMetafields: refetch,
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
        metafields: productFieldsNormalized,
        metafieldsLoading: false,
        metafieldsError: null,
        metafieldsAPIData: data,
        refetchMetafields: refetch,
    }
}

const useAppFields = (app, shop) => {
    const { data, error } = useSWR('/api/fields', (url) =>
        fetchWrapper(app, shop)(url).then((res) => res.json())
    )
    const loading = !data && !error

    return { appFields: data, appFieldsLoading: loading, appFieldsError: error }
}

const useMetafieldMutations = () => {
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

    const [updateMetafields, { loading: updateLoading, error: updateError }] =
        useMutation(UPDATE_MUTATION, { ignoreResults: true })
    // const updateMetafields = null
    // const updateLoading = null
    // const updateError = null

    const [createMetafields, { loading: createLoading, error: createError }] =
        useMutation(CREATE_MUTATION, { ignoreResults: true })

    // const mock1 = (q) => {
    //     console.log('_1')
    //     console.log(q)
    //     console.log(UPDATE_MUTATION)
    // }
    // const mock2 = (q) => {
    //     console.log('_2')
    //     console.log(q)
    //     console.log(CREATE_MUTATION)
    // }

    return {
        updateMetafields, //: mock1,
        createMetafields, //: mock2,
        loading: updateLoading || createLoading,
        error: updateError || createError,
    }
}

const getMutationInputTables = (appFields, shopifyMetafields, formValues) => {
    const appFieldsNormalized = {}
    appFields.forEach((item) => {
        appFieldsNormalized[item.name] = item
    })

    const fieldsToCreate = []
    const fieldsToUpdate = []

    for (const key in formValues) {
        const existsInShopify = shopifyMetafields[key]

        if (existsInShopify) {
            const wasChanged = formValues[key] !== shopifyMetafields[key].value
            if (!wasChanged) continue

            fieldsToUpdate.push({
                id: shopifyMetafields[key].id,
                value: formValues[key],
            })
        } else {
            const hasNoValue = formValues[key] === ''
            if (hasNoValue) continue

            fieldsToCreate.push({
                key: key,
                value: formValues[key],
                valueType:
                    appFieldsNormalized[key].value === 'TEXT'
                        ? 'STRING'
                        : 'STRING', // TODO
                namespace: APP_METAFIELD_NAMESPACE,
            })
        }
    }

    return { fieldsToCreate, fieldsToUpdate }
}

const useFormValues = (appFields, metafields, metafieldsAPIData) => {
    const [formValues, setFormValues] = useState({})

    useEffect(() => {
        if (!appFields || !metafields) return

        const values = {}
        appFields.forEach((item) => {
            const value = metafields[item.name]?.value || ''
            values[item.name] = value
        })

        setFormValues(values)
    }, [appFields, metafieldsAPIData])

    return [formValues, setFormValues]
}

const Product = () => {
    const app = useAppBridge()

    const router = useRouter()
    const { id } = router.query

    // Global app context
    const { appState } = useContext(FrameContext)

    // Fields from the app's database
    const { appFields, appFieldsLoading, appFieldsError } = useAppFields(
        app,
        appState.shop
    )

    // Shopify product data
    const { product, productLoading, productError } = useProduct(id)

    // Shopify product metafields
    const {
        metafields,
        metafieldsLoading,
        metafieldsError,
        metafieldsAPIData,
        refetchMetafields,
    } = useShopifyMetafields(id)

    // Two separate mutations to update product
    const {
        updateMetafields,
        createMetafields,
        loading: submitLoading,
        error: submitError,
    } = useMetafieldMutations()

    // Form state
    const [formValues, setFormValues] = useFormValues(
        appFields,
        metafields,
        metafieldsAPIData
    )

    const onSubmit = async () => {
        // Two separate tables, for new and existing metafields
        const { fieldsToCreate, fieldsToUpdate } = getMutationInputTables(
            appFields,
            metafields,
            formValues
        )

        await updateMetafields({
            variables: {
                input: {
                    id: `gid://shopify/Product/${id}`,
                    metafields: fieldsToUpdate,
                },
            },
        })

        console.log(fieldsToCreate)

        if (fieldsToCreate.length > 0) {
            await createMetafields({
                variables: {
                    input: {
                        id: `gid://shopify/Product/${id}`,
                        metafields: fieldsToCreate,
                    },
                },
            })
        }

        if (fieldsToCreate.length > 0 || fieldsToUpdate.length > 0) {
            await refetchMetafields()
        }
    }

    console.log(metafields, formValues, appFields)

    return (
        <Page
            breadcrumbs={[
                {
                    content: 'Products',
                    onAction: () =>
                        Redirect.create(app).dispatch(Redirect.Action.APP, '/'),
                },
            ]}
            title={
                !productLoading && product?.title
                    ? `Edit fields for "${product.title}"`
                    : ''
            }
        >
            <Layout>
                <Layout.Section>
                    {(appFieldsLoading ||
                        productLoading ||
                        metafieldsLoading) && <Loading />}
                    {Array.isArray(appFields) && metafields && product && (
                        <Card sectioned>
                            <Form onSubmit={onSubmit}>
                                <FormLayout>
                                    <Stack>
                                        {/* <Layout> */}
                                        {/* <Layout.Section
                                                    key={field._id}
                                                    oneHalf
                                                > */}
                                        {appFields.map((field) => {
                                            return (
                                                <TextField
                                                    key={field._id}
                                                    value={
                                                        formValues[field.name]
                                                    }
                                                    onChange={(v) =>
                                                        setFormValues({
                                                            ...formValues,
                                                            [field.name]: v,
                                                        })
                                                    }
                                                    label={field.name}
                                                />
                                            )
                                        })}
                                        {/* </Layout.Section> */}
                                        {/* </Layout> */}
                                    </Stack>
                                    <Button
                                        submit
                                        primary
                                        loading={
                                            appFieldsLoading ||
                                            productLoading ||
                                            metafieldsLoading
                                        }
                                    >
                                        Save
                                    </Button>
                                </FormLayout>
                            </Form>
                        </Card>
                    )}
                </Layout.Section>
            </Layout>
        </Page>
    )
}

export default Product
