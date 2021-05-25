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
import { useState } from 'react'
import { Redirect } from '@shopify/app-bridge/actions'
import { useAppBridge } from '@shopify/app-bridge-react'
import { fieldTypes } from '../lib/constants'

const fields = [
    {
        id: '1',
        name: 'Field1',
        description: 'This is the 1st field',
        type: fieldTypes.TEXT,
    },
    {
        id: '2',
        name: 'Field2',
        description: 'This is the 2nd field',
        type: fieldTypes.TEXT,
    },
]

const FieldsList = () => {
    const app = useAppBridge()

    const onItemClick = (id) => {
        Redirect.create(app).dispatch(Redirect.Action.APP, `/edit-field/${id}`)
    }

    const emptyState = (
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
                            style={{ display: 'none' }}
                            resourceName={{
                                singular: 'field',
                                plural: 'fields',
                            }}
                            itemCount={fields.length}
                            emptyState={emptyState}
                            headings={[
                                { title: 'Field Name' },
                                { title: 'Description' },
                                { title: 'Type' },
                            ]}
                            selectable={false}
                            selectedItemsCount={0}
                            loading={false}
                        >
                            {fields.map((field) => (
                                <IndexTable.Row key={field.id}>
                                    <IndexTable.Cell flush>
                                        <CellWrapper id={field.id}>
                                            <TextStyle variation="strong">
                                                {field.name}
                                            </TextStyle>
                                        </CellWrapper>
                                    </IndexTable.Cell>
                                    <IndexTable.Cell flush>
                                        <CellWrapper id={field.id} xPadding>
                                            {field.description}
                                        </CellWrapper>
                                    </IndexTable.Cell>
                                    <IndexTable.Cell flush>
                                        <CellWrapper id={field.id} xPadding>
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
