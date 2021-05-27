/* eslint-disable shopify/jsx-no-complex-expressions */
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
    TextField,
} from '@shopify/polaris'
import { useContext, useEffect, useState } from 'react'
import FieldForm from '../../components/FieldForm'
import { fieldTypes } from '../../lib/constants'
import { useRouter } from 'next/router'
import { useAppBridge } from '@shopify/app-bridge-react'
import { Redirect } from '@shopify/app-bridge/actions'
import { authenticatedFetch } from '@shopify/app-bridge-utils'
import useSWR from 'swr'
import { FrameContext } from '../../components/FrameContext'
import { fetchWrapper } from '../../lib/helpers'

const EditField = () => {
    const app = useAppBridge()

    const router = useRouter()
    const { id } = router.query

    const [submitError, setSubmitError] = useState('')
    const [submitLoading, setSubmitLoading] = useState('')

    const { appState, setAppState } = useContext(FrameContext)

    useEffect(() => {
        // Clear any toast
        setAppState({ ...appState, toast: '' })
    }, [])

    const { data, error } = useSWR(`/api/field/${id}`, (url) =>
        fetchWrapper(app, appState.shop)(url).then((res) => res.json())
    )

    const loading = !data && !error

    const onSubmit = async (data) => {
        setSubmitLoading(true)
        setSubmitError('')

        const fetch = fetchWrapper(app, appState.shop)

        try {
            const res = await fetch(`/api/field/${id}`, {
                method: 'PUT',
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
                setSubmitError(
                    body.error || 'Unexpected error. Please try again later.'
                )
                setSubmitLoading(false)
                return
            }

            if (res.status !== 200) {
                setSubmitError('Unexpected error. Please try again later.')
                setSubmitLoading(false)
                return
            }

            setAppState({ ...appState, toast: 'Saved' })
            setSubmitLoading(false)

            Redirect.create(app).dispatch(Redirect.Action.APP, `/fields-list`)
        } catch (e) {
            setSubmitError('Unexpected error. Please try again later.')
            setSubmitLoading(false)
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
            title={data ? `Edit "${data.name}"` : ''}
        >
            {error && (
                <div style={{ margin: '1.6rem 0' }}>
                    <Banner title="Error" status="critical">
                        <p>{submitError}</p>
                    </Banner>
                </div>
            )}
            <Layout>
                <Layout.Section>
                    <Card sectioned>
                        {loading && 'Loading'}

                        {data && (
                            <FieldForm
                                initialData={{
                                    name: data.name,
                                    description: data.description,
                                    type: data.type,
                                }}
                                isTypeChangeable={false}
                                onSubmit={onSubmit}
                                loading={loading || submitLoading}
                            />
                        )}
                    </Card>
                </Layout.Section>
            </Layout>
        </Page>
    )
}

export default EditField
