import { authenticatedFetch } from '@shopify/app-bridge-utils'
import { Redirect } from '@shopify/app-bridge/actions'

export const fetchWrapper = (app, shop) => {
    const fetchFunction = authenticatedFetch(app)

    return async (uri, options) => {
        const response = await fetchFunction(uri, options)
        const unauthHeader = response.headers.get(
            'X-Shopify-API-Request-Failure-Reauthorize'
        )

        if (unauthHeader === '1') {
            const url = `https://${document.location.hostname}/auth?shop=${shop}`
            Redirect.create(app).dispatch(Redirect.Action.REMOTE, url)
            return null
        }

        return response
    }
}