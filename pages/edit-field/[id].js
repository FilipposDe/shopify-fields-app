import { Banner, Card, Layout, Page, Loading } from '@shopify/polaris'
import { useContext, useEffect, useState } from 'react'
import FieldForm from '../../components/FieldForm'
import { useRouter } from 'next/router'
import { useAppBridge } from '@shopify/app-bridge-react'
import useSWR from 'swr'
import { FrameContext } from '../../components/FrameContext'
import { clientRedirect, getAppFetch } from '../../helpers/helpers'
import { useEditField } from '../../helpers/hooks'
import { AppContext } from '../../components/AppContext'

const EditField = () => {
    const app = useAppBridge()

    const router = useRouter()
    const { id } = router.query

    const { setGlobalToast } = useContext(FrameContext)
    const { appState } = useContext(AppContext)

    useEffect(() => {
        // Clear any toast
        setGlobalToast('')
    }, [])

    const { editField, error: editError, loading: editLoading } = useEditField()

    const { data, error } = useSWR(
        `/api/field/${id}`,
        getAppFetch(app, appState.shop, true)
    )

    const loading = !data && !error

    const onSubmit = async (data) => {
        const idRes = await editField(data, id)
        if (idRes) {
            // clientRedirect(app, '/fields-list')
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
                                isChangeable={false}
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
