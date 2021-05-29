import { authenticatedFetch } from '@shopify/app-bridge-utils'
import { Redirect } from '@shopify/app-bridge/actions'
import { GENERIC_ERROR_MSG, INACTIVE_JWT_MSG } from './constants'

export const getAppFetch = (app, shop, parseJSON = false) => {
    const fetchWithAuth = authenticatedFetch(app)

    return async (uri, options) => {
        let res
        try {
            res = await fetchWithAuth(uri, options)
        } catch (error) {
            // 1. Handle fetch error
            console.error(error)
            throw new CustomError(GENERIC_ERROR_MSG)
        }

        // 2. Handle 403 by redirecting browser
        const unauthHeader = res.headers.get(
            'X-Shopify-API-Request-Failure-Reauthorize'
        )
        if (unauthHeader === '1') {
            const url = `https://${document.location.hostname}/auth?shop=${shop}`
            Redirect.create(app).dispatch(Redirect.Action.REMOTE, url)
            return null
        }

        // 3. Handle inactive jwt Shopify bug error
        if (res.status === 400) {
            try {
                const body = await res.json()
                if (body.error === INACTIVE_JWT_MSG) {
                    // TODO Retry?
                    throw new CustomError(GENERIC_ERROR_MSG)
                }
            } catch (error) {}
        }

        // 3. Return response...
        if (!parseJSON) {
            return res
        }

        // 4. ...or parse JSON
        let objectRes
        try {
            objectRes = await res.json()
        } catch (error) {
            // 5. Handle parse error
            console.error(error)
            throw new CustomError(GENERIC_ERROR_MSG)
        }

        // 6. Handle not OK response
        if (!res.ok) {
            throw new CustomError(objectRes.error || GENERIC_ERROR_MSG)
        }

        // 7. Return body object
        return objectRes
    }
}

export class CustomError extends Error {
    constructor(message) {
        super(message)
        this.name = 'CustomError'
    }
}

export function clientRedirect(app, path) {
    Redirect.create(app).dispatch(Redirect.Action.APP, path)
}
