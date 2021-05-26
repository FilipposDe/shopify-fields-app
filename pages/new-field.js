import {
    Banner,
    Button,
    Card,
    Checkbox,
    ChoiceList,
    Form,
    FormLayout,
    Heading,
    Layout,
    Page,
    Toast,
    TextField,
} from '@shopify/polaris'
import { useContext, useEffect, useState } from 'react'
import FieldForm from '../components/FieldForm'
import { Redirect } from '@shopify/app-bridge/actions'
import { useAppBridge } from '@shopify/app-bridge-react'
import { fieldTypes } from '../lib/constants'
import { authenticatedFetch } from '@shopify/app-bridge-utils'
import { FrameContext } from '../components/FrameContext'
import { fetchWrapper } from '../lib/helpers'

const types = {
    TEXT: 'TEXT',
    NUMBER: 'NUMBER',
}

const NewField = (props) => {
    const app = useAppBridge()

    const [error, setError] = useState('')
    const [loading, setLoading] = useState('')

    const { appState, setAppState } = useContext(FrameContext)

    useEffect(() => {
        // Clear any toast
        setAppState({ ...appState, toast: '' })
    }, [])

    const onSubmit = async (data) => {
        setLoading(true)
        setError('')

        const fetch = fetchWrapper(app, appState.shop)

        try {
            const res = await fetch('/api/field', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            })

            if (
                res.status !== 200 &&
                res.headers
                    .get('content-type')
                    ?.toLocaleLowerCase()
                    ?.includes('application/json')
            ) {
                const body = await res.json()
                setError(
                    body.error || 'Unexpected error. Please try again later.'
                )
                setLoading(false)
                return
            }

            if (res.status !== 200) {
                setError('Unexpected error. Please try again later.')
                setLoading(false)
                return
            }

            const body = await res.json()
            const { id } = body

            setAppState({ ...appState, toast: 'Saved' })
            setLoading(false)

            Redirect.create(app).dispatch(Redirect.Action.APP, `/fields-list`)
        } catch (e) {
            setError('Unexpected error. Please try again later.')
            setLoading(false)
            return
        }
    }

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
                                key: '',
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
