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
    Banner,
} from '@shopify/polaris'
import { useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useAppBridge } from '@shopify/app-bridge-react'
import { Redirect } from '@shopify/app-bridge/actions'
import { gql, useMutation, useQuery } from '@apollo/client'
import { APP_METAFIELD_NAMESPACE, fieldTypes } from '../../lib/constants'
import { FrameContext } from '../../components/FrameContext'
import useSWR from 'swr'
import {
    CustomError,
    fetchWrapper,
    getCustomJWTFetcher,
} from '../../lib/helpers'

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

function useAppFields(app, shop) {
    const { data, error } = useSWR(
        '/api/fields',
        getCustomJWTFetcher(app, shop)
    )

    const loading = !data && !error

    return {
        appFields: data,
        appFieldsLoading: loading,
        appFieldsError: error,
    }
}

function useMetafieldMutations() {
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

    const [updateMetafields, { error: updateError }] =
        useMutation(UPDATE_MUTATION)

    const [createMetafields, { error: createError }] =
        useMutation(CREATE_MUTATION)

    return {
        updateMetafields,
        createMetafields,
        error: updateError || createError,
    }
}

function getMutationInputTables(appFields, shopifyMetafields, formValues) {
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

function useFormValues(appFields, metafields, metafieldsAPIData) {
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
    const { appState, setAppState } = useContext(FrameContext)

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
        error: submitError,
    } = useMetafieldMutations()

    // Form state
    const [formValues, setFormValues] = useFormValues(
        appFields,
        metafields,
        metafieldsAPIData
    )

    // Mutations state
    const [submitLoading, setSubmitLoading] = useState(false)

    const onSubmit = async () => {
        setSubmitLoading(true)

        try {
            // Two separate tables, for new and existing metafields
            const { fieldsToCreate, fieldsToUpdate } = getMutationInputTables(
                appFields,
                metafields,
                formValues
            )

            if (fieldsToUpdate.length > 0) {
                await updateMetafields({
                    variables: {
                        input: {
                            id: `gid://shopify/Product/${id}`,
                            metafields: fieldsToUpdate,
                        },
                    },
                })
            }

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
            setAppState({ ...appState, toast: 'Saved' })
        } catch (error) {}

        setSubmitLoading(false)
    }

    const getInputMode = (type) => {
        switch (type) {
            case fieldTypes.TEXT:
                return 'text'
            case fieldTypes.NUMBER:
                return 'decimal'
            default:
                return 'text'
        }
    }

    const getErrorMessage = (error) => {
        if (error) {
            if (error instanceof CustomError) {
                return error.message
            } else {
                return 'Unexpected error. Please try again later.'
            }
        }
        return ''
    }

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
            {appFieldsError ||
                metafieldsError ||
                productError ||
                (submitError && (
                    <div style={{ margin: '1.6rem 0' }}>
                        <Banner title="Error" status="critical">
                            <p>
                                {getErrorMessage(
                                    appFieldsError ||
                                        metafieldsError ||
                                        productError ||
                                        submitError
                                )}
                            </p>
                        </Banner>
                    </div>
                ))}
            <Layout>
                <Layout.Section>
                    {(appFieldsLoading ||
                        productLoading ||
                        metafieldsLoading ||
                        submitLoading) && <Loading />}
                    {Array.isArray(appFields) && metafields && product && (
                        <Card sectioned>
                            <Form onSubmit={onSubmit}>
                                <FormLayout>
                                    <Stack>
                                        {appFields.map((field) => {
                                            return (
                                                <TextField
                                                    inputMode={getInputMode(
                                                        field.type
                                                    )}
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
                                                    helpText={
                                                        field.description || ''
                                                    }
                                                />
                                            )
                                        })}
                                    </Stack>
                                    <Button
                                        submit
                                        primary
                                        loading={submitLoading}
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
