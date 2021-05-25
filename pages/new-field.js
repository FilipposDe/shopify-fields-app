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
import { useState } from 'react'
import FieldForm from '../components/FieldForm'
import { Redirect } from '@shopify/app-bridge/actions'
import { useAppBridge } from '@shopify/app-bridge-react'
import { fieldTypes } from '../lib/constants'

const types = {
    TEXT: 'TEXT',
    NUMBER: 'NUMBER',
}

const NewField = () => {
    const app = useAppBridge()

    return (
        <Page
            breadcrumbs={[
                {
                    content: 'Fields',
                    onAction: () =>
                        Redirect.create(app).dispatch(
                            Redirect.Action.APP,
                            `/fields-list`
                        ),
                },
            ]}
            title="New field"
            subtitle="Create a new field for your products."
        >
            <Layout sectioned>
                <Layout.Section>
                    <Card sectioned>
                        <FieldForm
                            initialData={{
                                key: '',
                                description: '',
                                type: fieldTypes.TEXT,
                            }}
                            onSubmit={(data) => console.log(data)}
                        />
                    </Card>
                </Layout.Section>
            </Layout>
        </Page>
    )
}

export default NewField
