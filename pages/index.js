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
    Filters,
} from '@shopify/polaris'
import { Redirect, AppLink, NavigationMenu } from '@shopify/app-bridge/actions'
import { useAppBridge } from '@shopify/app-bridge-react'
import { gql, useQuery, useLazyQuery } from '@apollo/client'
import { useEffect, useState } from 'react'
import { useAllProducts, useSearchProducts } from '../lib/hooks'

const Index = () => {
    const app = useAppBridge()

    const { products, loading, error, fetchNext, hasNext } = useAllProducts()
    const { query, productResults, searchLoading, searchError, search } =
        useSearchProducts()

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

    const filterControl = (
        <Filters
            filters={[]}
            queryValue={query}
            onQueryChange={search}
            onQueryClear={() => search('')}
        />
    )

    return (
        <Page
            title="Products"
            subtitle="Click on a product to edit its custom fields"
        >
            {(error || searchError) && (
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
                            emptyState={!error && !searchError && emptyState}
                            loading={loading || searchLoading}
                            items={(query ? productResults : products) || []}
                            resourceName={{
                                singular: 'product',
                                plural: 'products',
                            }}
                            filterControl={filterControl}
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
                        {!query && (
                            <Pagination
                                hasPrevious={false}
                                onPrevious={() => {}}
                                hasNext={hasNext}
                                onNext={fetchNext}
                                label="More"
                            />
                        )}
                    </Card>
                </Layout.Section>
            </Layout>
        </Page>
    )
}

export default Index
