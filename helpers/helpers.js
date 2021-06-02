import { authenticatedFetch, getSessionToken } from '@shopify/app-bridge-utils'
import { Redirect } from '@shopify/app-bridge/actions'
import deepMerge from '@shopify/app-bridge/actions/merge'
import { GENERIC_ERROR_MSG, INACTIVE_JWT_MSG } from './constants'

export const getAppFetch = (
    app,
    shop,
    parseJSON = false,
    retryOnInactiveJWT = true
) => {
    const totalAttempts = retryOnInactiveJWT && 3

    const fetch = async (uri, options, attempt = totalAttempts) => {
        const fetchWithAuth = authenticatedFetch(app)

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

        if (res.status === 400) {
            try {
                // 3. Handle inactive jwt Shopify bug error
                const body = await res.json()
                if (body.error === INACTIVE_JWT_MSG) {
                    if (retryOnInactiveJWT && attempt > 0) {
                        // Wait 1 second
                        await new Promise((_) => setTimeout(_, 500))
                        return await fetch(uri, options, attempt - 1)
                    } else {
                        throw new CustomError(GENERIC_ERROR_MSG)
                    }
                }
            } catch (error) {}

            try {
                // 4. Handle koa-shopify-auth issue with redirection to "/auth"
                const text = await res.text()
                if (text === 'Expected a valid shop query parameter') {
                    // TODO check if this handles it
                    // - This does not include requests to /__nextjs_original-stack-frame
                    const url = `https://${document.location.hostname}/auth?shop=${shop}`
                    Redirect.create(app).dispatch(Redirect.Action.REMOTE, url)
                    return null
                }
            } catch (error) {}
        }

        // 5. Return response...
        if (!parseJSON) {
            return res
        }

        // 6. ...or parse JSON
        let body
        try {
            body = await res.json()
        } catch (error) {
            // 7. Handle parse error
            console.error(error)
            throw new CustomError(GENERIC_ERROR_MSG)
        }

        // 8. Handle not OK response
        if (!res.ok) {
            throw new CustomError(body.error || GENERIC_ERROR_MSG)
        }

        // 9. Return body object
        return body
    }

    return fetch
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
