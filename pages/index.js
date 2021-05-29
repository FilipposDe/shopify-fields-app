import {
    Card,
    EmptyState,
    Heading,
    Layout,
    Page,
    ResourceItem,
    ResourceList,
    TextStyle,
    Banner,
    Thumbnail,
    Pagination,
} from '@shopify/polaris'
import { Redirect, AppLink, NavigationMenu } from '@shopify/app-bridge/actions'
import { useAppBridge } from '@shopify/app-bridge-react'
import { gql, useQuery } from '@apollo/client'
import { useEffect, useState } from 'react'

const Index = () => {
    const app = useAppBridge()

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
            // after: cursors.first,
        },
    })

    const [cursors, setCursors] = useState({ first: '', last: '' })

    const products = data?.products?.edges?.map((edge) => edge.node)

    const responseCursors = data?.products?.edges?.map((edge) => edge.cursor)
    const firstCursor = responseCursors?.[0]
    const lastCursor = responseCursors?.[responseCursors?.length - 1]
    const hasPreviousPage = data?.products?.pageInfo?.hasPreviousPage
    const hasNextPage = data?.products?.pageInfo?.hasNextPage

    useEffect(() => {
        setCursors({ last: lastCursor || null, first: firstCursor || null })
    }, [firstCursor, lastCursor])

    // console.log('firstCursor', firstCursor)
    // console.log('lastCursor', lastCursor)
    // console.log('hasPreviousPage', hasPreviousPage)
    // console.log('hasNextPage', hasNextPage)
    // console.log('cursors', cursors)
    // console.log('data', data)
    // console.log(
    //     'products',
    //     products?.map((i) => i.title)
    // )

    // const products = []
    // console.log('1', data)
    // console.log('2', error)
    // console.log('3', loading)

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

    const getProductMedia = (item) => {
        return (
            <Thumbnail
                source={
                    item.images.edges[0]
                        ? item.images.edges[0].node.originalSrc
                        : ''
                }
                alt={
                    item.images.edges[0]
                        ? item.images.edges[0].node.altText
                        : ''
                }
            />
        )
    }

    return (
        <Page
            title="Products"
            subtitle="Click on a product to edit its custom fields"
        >
            {error && (
                <div style={{ margin: '1.6rem 0' }}>
                    <Banner title="Error" status="critical">
                        <p>Unexpected error. Please try again later.</p>
                    </Banner>
                </div>
            )}
            <Layout>
                <Layout.Section>
                    <Card sectioned>
                        <ResourceList
                            emptyState={!error && emptyState}
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
                                    media={getProductMedia(item)}
                                >
                                    <h3>
                                        <TextStyle variation="strong">
                                            {item.title}
                                        </TextStyle>
                                    </h3>
                                </ResourceItem>
                            )}
                        />
                        <Pagination
                            hasPrevious={false}
                            onPrevious={() => {
                                const variables = { first: 10 }
                                if (cursors.first) {
                                    variables['before'] = cursors.first
                                }
                                console.log('next@b')
                                console.log(variables)
                                fetchMore({ variables })
                            }}
                            hasNext={hasNextPage}
                            onNext={() => {
                                const variables = { first: 10 }
                                if (cursors.last) {
                                    variables['after'] = cursors.last
                                }
                                console.log('next@')
                                console.log(variables)
                                fetchMore({ variables })
                            }}
                            label="More"
                        />
                    </Card>
                </Layout.Section>
            </Layout>
        </Page>
    )
}

export default Index
