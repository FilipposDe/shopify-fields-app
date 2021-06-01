import {
    Card,
    EmptyState,
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
import { useAppBridge } from '@shopify/app-bridge-react'
import { useAllProducts, useSearchProducts } from '../helpers/hooks'
import { clientRedirect } from '../helpers/helpers'
import { GENERIC_ERROR_MSG } from '../helpers/constants'

const Index = () => {
    const app = useAppBridge()

    const { products, loading, error, fetchNext, hasNext } = useAllProducts()
    const { query, productResults, searchLoading, searchError, search } =
        useSearchProducts()

    const emptyState = (
        <EmptyState
            heading="Add custom fields to your products"
            action={{
                content: 'New field',
                onAction: () => clientRedirect(app, '/new-field'),
            }}
            image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
        >
            <p>Create and manage fields for your products.</p>
        </EmptyState>
    )

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

    const showEmptyState = () =>
        !error &&
        !searchError &&
        !loading &&
        !searchLoading &&
        !products?.length

    const showComponentLoading = () => loading || searchLoading

    const getListItems = () => (query ? productResults : products) || []

    return (
        <Page
            title="Products"
            subtitle="Click on a product to edit its custom fields"
        >
            {(error || searchError) && (
                <div style={{ margin: '1.6rem 0' }}>
                    <Banner title="Error" status="critical">
                        <p>{GENERIC_ERROR_MSG}</p>
                    </Banner>
                </div>
            )}
            <Layout>
                <Layout.Section>
                    <Card sectioned>
                        <ResourceList
                            emptyState={showEmptyState() && emptyState}
                            loading={showComponentLoading()}
                            items={getListItems()}
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
                                        clientRedirect(
                                            app,
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
