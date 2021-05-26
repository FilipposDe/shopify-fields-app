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
} from '@shopify/polaris'
import { useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useAppBridge } from '@shopify/app-bridge-react'
import { Redirect } from '@shopify/app-bridge/actions'
import { gql, useQuery } from '@apollo/client'
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

function useMetafields(id) {
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

    const { data, loading, error } = useQuery(QUERY)

    if (loading || error) {
        return {
            metafields: null,
            metafieldsLoading: loading,
            metafieldsError: error,
        }
    }

    const metafields = data?.product.metafields.edges.map((edge) => edge.node)
    // .filter((item) => item.namespace === APP_METAFIELD_NAMESPACE)

    if (!Array.isArray(metafields)) {
        return {
            metafields: null,
            metafieldsLoading: false,
            metafieldsError: null,
        }
    }

    if (metafields.length >= 250) {
        return {
            metafields: null,
            metafieldsLoading: false,
            metafieldsError: {
                error: 'Exceeded number of metafields, some of them might not be visible.',
            },
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
    }
}

const Product = () => {
    const app = useAppBridge()

    const router = useRouter()
    const { id } = router.query

    const { appState } = useContext(FrameContext)

    const { data: fieldsData, error: fieldsDataError } = useSWR(
        '/api/fields',
        (url) => fetchWrapper(app, appState.shop)(url).then((res) => res.json())
    )
    const fieldsDataLoading = !fieldsData && !fieldsDataError

    const { product, productLoading, productError } = useProduct(id)

    const { metafields, metafieldsLoading, metafieldsError } = useMetafields(id)

    console.log(product, metafields)

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
                    {(fieldsDataLoading ||
                        productLoading ||
                        metafieldsLoading) && <Loading />}
                    {Array.isArray(fieldsData) && metafields && product && (
                        <Card sectioned>
                            <Form onSubmit={() => {}}>
                                <FormLayout>
                                    {fieldsData.map((field) => {
                                        return (
                                            <TextField
                                                key={field._id}
                                                value={
                                                    metafields[field.name] || ''
                                                }
                                                onChange={() => {}}
                                                label={field.name}
                                            />
                                        )
                                    })}
                                    <Button submit primary>
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
