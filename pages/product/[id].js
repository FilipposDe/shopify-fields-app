import {
    Button,
    Card,
    Form,
    FormLayout,
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
import { APP_METAFIELD_NAMESPACE, fieldTypes } from '../../lib/constants'
import { FrameContext } from '../../components/FrameContext'
import { CustomError } from '../../lib/helpers'
import { useProduct, useAppFields, useEditMetafields } from '../../lib/hooks'

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
    const {
        product,
        productLoading,
        productError,
        metafieldsNormalized,
        initialResponse,
        refetch,
    } = useProduct(id)

    // Two separate mutations to update product
    const {
        updateMetafields,
        createMetafields,
        error: submitError,
        loading: submitLoading,
    } = useEditMetafields()

    // Form state
    const [formValues, setFormValues] = useFormValues(
        appFields,
        metafieldsNormalized,
        initialResponse
    )

    const onSubmit = async () => {
        // Two separate tables, for new and existing metafields
        const { fieldsToCreate, fieldsToUpdate } = getMutationInputTables(
            appFields,
            metafieldsNormalized,
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
            await refetch()
        }

        setAppState({ ...appState, toast: 'Saved' })
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
                productError ||
                (submitError && (
                    <div style={{ margin: '1.6rem 0' }}>
                        <Banner title="Error" status="critical">
                            <p>
                                {appFieldsError || productError || submitError}
                            </p>
                        </Banner>
                    </div>
                ))}
            <Layout>
                <Layout.Section>
                    {(appFieldsLoading || productLoading || submitLoading) && (
                        <Loading />
                    )}
                    {Array.isArray(appFields) && product && (
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
