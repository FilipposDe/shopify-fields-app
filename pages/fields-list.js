import {
    Card,
    EmptyState,
    Layout,
    Page,
    IndexTable,
    TextStyle,
} from '@shopify/polaris'
import { useContext } from 'react'
import { useAppBridge } from '@shopify/app-bridge-react'
import useSWR from 'swr'
import { clientRedirect, getAppFetch } from '../lib/helpers'
import { FrameContext } from '../components/FrameContext'

const FieldsList = () => {
    const app = useAppBridge()
    const { appState } = useContext(FrameContext)

    const { data, error } = useSWR(
        '/api/fields',
        getAppFetch(app, appState.shop, true)
    )
    const loading = !data && !error

    const onItemClick = (id) => {
        clientRedirect(app, `/edit-field/${id}`)
    }

    const emptyState = (
        <EmptyState
            heading="Add custom fields to your products"
            action={{
                content: 'New field',
                onAction: () => {
                    clientRedirect(app, '/new-field')
                },
            }}
            image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
        >
            <p>Create and manage fields for your products.</p>
        </EmptyState>
    )

    const CellWrapper = (props) => (
        <div
            onClick={(_) => onItemClick(props.id)}
            style={{ padding: `0.8rem ${props.xPadding ? '1.6rem' : '0'}` }}
        >
            {props.children}
        </div>
    )

    const showEmptyState = () => !loading && !data

    return (
        <Page
            title="Fields"
            subtitle="Click on a field to edit"
            primaryAction={{
                content: 'New field',
                onAction: () => {
                    clientRedirect(app, '/new-field')
                },
            }}
        >
            <Layout>
                <Layout.Section>
                    <Card sectioned>
                        <IndexTable
                            resourceName={{
                                singular: 'field',
                                plural: 'fields',
                            }}
                            itemCount={data?.length || 0}
                            emptyState={showEmptyState() && emptyState}
                            headings={[
                                { title: 'Field Name' },
                                { title: 'Description' },
                                { title: 'Type' },
                            ]}
                            selectable={false}
                            selectedItemsCount={0}
                            loading={loading}
                        >
                            {Array.isArray(data) &&
                                data.map((field) => (
                                    <IndexTable.Row key={field._id}>
                                        <IndexTable.Cell flush>
                                            <CellWrapper id={field._id}>
                                                <TextStyle variation="strong">
                                                    {field.name}
                                                </TextStyle>
                                            </CellWrapper>
                                        </IndexTable.Cell>
                                        <IndexTable.Cell flush>
                                            <CellWrapper
                                                id={field._id}
                                                xPadding
                                            >
                                                {field.description}
                                            </CellWrapper>
                                        </IndexTable.Cell>
                                        <IndexTable.Cell flush>
                                            <CellWrapper
                                                id={field._id}
                                                xPadding
                                            >
                                                {field.type}
                                            </CellWrapper>
                                        </IndexTable.Cell>
                                    </IndexTable.Row>
                                ))}
                        </IndexTable>
                    </Card>
                </Layout.Section>
            </Layout>
        </Page>
    )
}

export default FieldsList
