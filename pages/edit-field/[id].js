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
import FieldForm from '../../components/FieldForm'
import { fieldTypes } from '../../lib/constants'
import { useRouter } from 'next/router'
import { useAppBridge } from '@shopify/app-bridge-react'
import { Redirect } from '@shopify/app-bridge/actions'

const fieldData = {
    name: 'afield',
    description: 'This is a test field',
    type: fieldTypes.TEXT,
}

const EditField = () => {
    const app = useAppBridge()

    const router = useRouter()
    const { id } = router.query

    const { name, description, type } = fieldData

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
            title={`Edit "${fieldData.name}"`}
        >
            <Layout>
                <Layout.Section>
                    <Card sectioned>
                        <FieldForm
                            initialData={{
                                name,
                                description,
                                type,
                            }}
                            onSubmit={(data) => console.log(data)}
                        />
                    </Card>
                </Layout.Section>
            </Layout>
        </Page>
    )
}

export default EditField
