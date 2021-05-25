import {
    Card,
    EmptyState,
    Heading,
    Layout,
    Page,
    ResourceItem,
    ResourceList,
    TextStyle,
} from '@shopify/polaris'
import { Redirect, AppLink, NavigationMenu } from '@shopify/app-bridge/actions'
import { useAppBridge } from '@shopify/app-bridge-react'
import { gql, useQuery } from '@apollo/client'

const Index = () => {
    const app = useAppBridge()

    const QUERY = gql`
        query {
            products(first: 10) {
                edges {
                    node {
                        id
                        title
                    }
                }
            }
        }
    `

    const { data, loading, error } = useQuery(QUERY)

    const products = data?.products?.edges?.map((edge) => edge.node)

    const emptyState =
        !loading && !products?.length ? (
            <EmptyState
                heading="Add custom fields to your products"
                action={{
                    content: 'New field',
                    onAction: () => {
                        Redirect.create(app).dispatch(
                            Redirect.Action.APP,
                            '/new-field'
                        )
                    },
                }}
                image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
            >
                <p>Create and manage fields for your products.</p>
            </EmptyState>
        ) : undefined

    return (
        <Page
            title="Products"
            subtitle="Click on a product to edit its custom fields"
        >
            <Layout>
                <Layout.Section>
                    <Card sectioned>
                        <ResourceList
                            emptyState={emptyState}
                            loading={loading}
                            items={products || []}
                            resourceName={{
                                singular: 'product',
                                plural: 'products',
                            }}
                            renderItem={(item) => (
                                <ResourceItem
                                    id={item.id}
                                    accessibilityLabel={`View details for ${item.title}`}
                                    name={item.title}
                                    onClick={() =>
                                        Redirect.create(app).dispatch(
                                            Redirect.Action.APP,
                                            `/product/${item.id.replace(
                                                'gid://shopify/Product/',
                                                ''
                                            )}`
                                        )
                                    }
                                >
                                    <h3>
                                        <TextStyle variation="strong">
                                            {item.title}
                                        </TextStyle>
                                    </h3>
                                </ResourceItem>
                            )}
                        />
                    </Card>
                </Layout.Section>
            </Layout>
        </Page>
    )
}

export default Index
