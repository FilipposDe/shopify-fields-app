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
    Toast,
} from '@shopify/polaris'
import { useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useAppBridge } from '@shopify/app-bridge-react'
import {
    APP_METAFIELD_NAMESPACE,
    fieldTypes,
    GENERIC_ERROR_MSG,
} from '../../helpers/constants'
import { AppContext } from '../../components/AppContext'
import { clientRedirect } from '../../helpers/helpers'
import {
    useProduct,
    useAppFields,
    useEditMetafields,
} from '../../helpers/hooks'

function getMutationInputTables(appFields, shopifyMetafields, formValues) {
    const appFieldsNormalized = {}
    if (!shopifyMetafields || !appFields) {
        debugger
    }
    appFields.forEach((item) => {
        appFieldsNormalized[item.name] = item
    })

    const fieldsToCreate = []
    const fieldsToUpdate = []
    const fieldsToDelete = []

    for (const key in formValues) {
        const existsInShopify = shopifyMetafields[key]

        if (existsInShopify) {
            const wasChanged = formValues[key] !== shopifyMetafields[key].value
            if (!wasChanged) continue

            if (formValues[key] === '') {
                fieldsToDelete.push({
                    id: shopifyMetafields[key].id,
                })
            } else {
                fieldsToUpdate.push({
                    id: shopifyMetafields[key].id,
                    value: formValues[key],
                })
            }
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

    return { fieldsToCreate, fieldsToUpdate, fieldsToDelete }
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

    const { appState } = useContext(AppContext)
    const [toast, setToast] = useState('')

    // Fields from the app's database
    const { appFields, appFieldsLoading, appFieldsError } = useAppFields(
        app,
        appState.shop
    )

    // Shopify product data
    const { product, productLoading, productError, initialResponse, refetch } =
        useProduct(id)

    // Two separate mutations to update product
    const {
        updateMetafields,
        createMetafields,
        deleteMetafield,
        error: submitError,
        loading: submitLoading,
    } = useEditMetafields()

    // Form state
    const [formValues, setFormValues] = useFormValues(
        appFields,
        product?.metafieldsNormalized,
        initialResponse
    )

    const onSubmit = async () => {
        // Two separate tables, for new and existing metafields
        const { fieldsToCreate, fieldsToUpdate, fieldsToDelete } =
            getMutationInputTables(
                appFields,
                product.metafieldsNormalized,
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

        if (fieldsToDelete.length > 0) {
            await Promise.all(
                fieldsToDelete.map(async (item) => {
                    return await deleteMetafield({
                        variables: {
                            input: {
                                id: item.id,
                            },
                        },
                    })
                })
            )
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

        if (
            fieldsToCreate.length ||
            fieldsToUpdate.length ||
            fieldsToDelete.length
        ) {
            await refetch()
        }

        setToast('Saved')
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

    // TODO important: log these
    ;(appFieldsError || submitError) &&
        console.log('err!', appFieldsError, submitError)

    return (
        <Page
            breadcrumbs={[
                {
                    content: 'Products',
                    onAction: () => clientRedirect(app, '/'),
                },
            ]}
            title={
                !productLoading && product?.title
                    ? `Edit fields for "${product.title}"`
                    : ''
            }
        >
            {toast && <Toast content={toast} onDismiss={() => setToast('')} />}
            {(appFieldsError || productError || submitError) && (
                <div style={{ margin: '1.6rem 0' }}>
                    <Banner title="Error" status="critical">
                        <p>
                            {appFieldsError ||
                                (productError ? GENERIC_ERROR_MSG : false) ||
                                submitError}
                        </p>
                    </Banner>
                </div>
            )}
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
