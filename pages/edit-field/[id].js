import { Banner, Card, Layout, Page, Loading } from '@shopify/polaris'
import { useContext, useEffect, useState } from 'react'
import FieldForm from '../../components/FieldForm'
import { useRouter } from 'next/router'
import { useAppBridge } from '@shopify/app-bridge-react'
import useSWR from 'swr'
import { FrameContext } from '../../components/FrameContext'
import { clientRedirect, getAppFetch } from '../../lib/helpers'
import { useEditField } from '../../lib/hooks'

const EditField = () => {
    const app = useAppBridge()

    const router = useRouter()
    const { id } = router.query

    const { appState, setAppState } = useContext(FrameContext)

    useEffect(() => {
        // Clear any toast
        setAppState({ ...appState, toast: '' })
    }, [])

    const { editField, error: editError, loading: editLoading } = useEditField()

    const { data, error } = useSWR(
        `/api/field/${id}`,
        getAppFetch(app, appState.shop, true)
    )

    const loading = !data && !error

    const onSubmit = async (data) => {
        const id = await editField(data, id)
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
            title={data ? `Edit "${data.name}"` : ''}
        >
            {error && (
                <div style={{ margin: '1.6rem 0' }}>
                    <Banner title="Error" status="critical">
                        <p>{editError || error}</p>
                    </Banner>
                </div>
            )}
            <Layout>
                <Layout.Section>
                    {loading && <Loading />}
                    {!loading && data && (
                        <Card sectioned>
                            <FieldForm
                                initialData={{
                                    name: data.name,
                                    description: data.description,
                                    type: data.type,
                                }}
                                isTypeChangeable={false}
                                onSubmit={onSubmit}
                                loading={loading || editLoading}
                            />
                        </Card>
                    )}
                </Layout.Section>
            </Layout>
        </Page>
    )
}

export default EditField
