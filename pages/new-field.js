import { Banner, Card, Layout, Page } from '@shopify/polaris'
import { useContext, useEffect, useState } from 'react'
import FieldForm from '../components/FieldForm'
import { useAppBridge } from '@shopify/app-bridge-react'
import { fieldTypes } from '../lib/constants'
import { FrameContext } from '../components/FrameContext'
import { clientRedirect } from '../lib/helpers'
import { useCreateField } from '../lib/hooks'

const NewField = () => {
    const app = useAppBridge()

    const { appState, setAppState } = useContext(FrameContext)

    useEffect(() => {
        // Clear any toast
        setAppState({ ...appState, toast: '' })
    }, [])

    const { createField, error, loading } = useCreateField()

    const onSubmit = async (data) => {
        const id = await createField(data)
        if (id) {
            clientRedirect(app, '/fields-list')
        }
    }

    return (
        <Page
            breadcrumbs={[
                {
                    content: 'Fields',
                    onAction: () => {
                        clientRedirect(app, '/fields-list')
                    },
                },
            ]}
            title="New field"
            subtitle="Create a new field for your products"
        >
            {error && (
                <div style={{ margin: '1.6rem 0' }}>
                    <Banner title="Error" status="critical">
                        <p>{error}</p>
                    </Banner>
                </div>
            )}
            <Layout>
                <Layout.Section>
                    <Card sectioned>
                        <FieldForm
                            initialData={{
                                name: '',
                                description: '',
                                type: fieldTypes.TEXT,
                            }}
                            onSubmit={onSubmit}
                            loading={loading}
                        />
                    </Card>
                </Layout.Section>
            </Layout>
        </Page>
    )
}

export default NewField
