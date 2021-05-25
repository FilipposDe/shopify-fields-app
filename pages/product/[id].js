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
} from '@shopify/polaris'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useAppBridge } from '@shopify/app-bridge-react'
import { Redirect } from '@shopify/app-bridge/actions'
import { gql, useQuery } from '@apollo/client'
import { fieldTypes } from '../../lib/constants'

const fields = [
    { id: 1, name: 'Location', type: fieldTypes.TEXT },
    { id: 2, name: 'Col.', type: fieldTypes.TEXT },
]

const Product = () => {
    const app = useAppBridge()

    const router = useRouter()
    const { id } = router.query

    const QUERY = gql`
        query {
            product(id: "gid://shopify/Product/${id}") {
                id
                title
            }
        }
    `

    const { data, loading, error } = useQuery(QUERY)

    // TODO useSWR fields

    const product = data?.product
    // const productFields = [{ key: 'Location', value: 'Greece' }]
    const productFieldsNormalized = { Location: 'Greece' }

    return (
        <Page
            breadcrumbs={[
                {
                    content: 'Products',
                    onAction: () =>
                        Redirect.create(app).dispatch(Redirect.Action.APP, '/'),
                },
            ]}
            title={`Edit fields for "${product?.title}"`}
        >
            <Layout>
                <Layout.Section>
                    <Card sectioned>
                        <Form onSubmit={() => {}}>
                            <FormLayout>
                                {fields.map((field) => {
                                    return (
                                        <TextField
                                            value={
                                                productFieldsNormalized[
                                                    field.name
                                                ] || ''
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
                </Layout.Section>
            </Layout>
        </Page>
    )
}

export default Product
