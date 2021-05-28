import {
    Card,
    EmptyState,
    Layout,
    Page,
    Button,
    Checkbox,
    ChoiceList,
    Form,
    FormLayout,
    Heading,
    TextField,
    IndexTable,
    TextStyle,
    ResourceItem,
    ResourceList,
} from '@shopify/polaris'
import { useContext, useEffect, useState } from 'react'
import { Redirect } from '@shopify/app-bridge/actions'
import { useAppBridge } from '@shopify/app-bridge-react'
import { fieldTypes } from '../lib/constants'
import { authenticatedFetch } from '@shopify/app-bridge-utils'
import useSWR from 'swr'
import { fetchWrapper, getCustomJWTFetcher } from '../lib/helpers'
import { FrameContext } from '../components/FrameContext'

const FieldsList = () => {
    const app = useAppBridge()
    const { appState } = useContext(FrameContext)

    const { data, error } = useSWR(
        '/api/fields',
        getCustomJWTFetcher(app, appState.shop)
    )
    const loading = !data && !error

    const onItemClick = (id) => {
        Redirect.create(app).dispatch(Redirect.Action.APP, `/edit-field/${id}`)
    }

    const emptyState = !loading && !data && (
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
    )

    const CellWrapper = (props) => (
        <div
            onClick={(_) => onItemClick(props.id)}
            style={{ padding: `0.8rem ${props.xPadding ? '1.6rem' : '0'}` }}
        >
            {props.children}
        </div>
    )

    return (
        <Page
            title="Fields"
            subtitle="Click on a field to edit"
            primaryAction={{
                content: 'New field',
                onAction: () => {
                    Redirect.create(app).dispatch(
                        Redirect.Action.APP,
                        '/new-field'
                    )
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
                            emptyState={emptyState}
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
