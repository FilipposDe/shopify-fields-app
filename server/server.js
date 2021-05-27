import '@babel/polyfill'
import dotenv from 'dotenv'
import 'isomorphic-fetch'
import createShopifyAuth, { verifyRequest } from '@shopify/koa-shopify-auth'
import Shopify, { ApiVersion } from '@shopify/shopify-api'
import Koa from 'koa'
import next from 'next'
import Router from 'koa-router'
import mongoose from 'mongoose'
import { deleteSession, loadSession, storeSession } from './db/sessionStorage'
import Shop from './models/shop'

dotenv.config()
const port = parseInt(process.env.PORT, 10) || 8081
const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

mongoose.connection.once('open', () => {
    console.log('Connected to database')
})

mongoose.connection.on('error', console.error)

mongoose
    .connect(
        `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_CLUSTER}.mongodb.net/fields?retryWrites=true&w=majority`,
        { useNewUrlParser: true, useUnifiedTopology: true }
    )
    .then(() => {
        Shopify.Context.initialize({
            API_KEY: process.env.SHOPIFY_API_KEY,
            API_SECRET_KEY: process.env.SHOPIFY_API_SECRET,
            SCOPES: process.env.SCOPES.split(','),
            HOST_NAME: process.env.HOST.replace(/https:\/\//, ''),
            API_VERSION: ApiVersion.April21,
            IS_EMBEDDED_APP: true,
            SESSION_STORAGE: new Shopify.Session.CustomSessionStorage(
                storeSession,
                loadSession,
                deleteSession
            ),
        })
    })
    .then(() => app.prepare())
    .then(async () => {
        const server = new Koa()
        const router = new Router()

        server.keys = [Shopify.Context.API_SECRET_KEY]
        server.use(
            createShopifyAuth({
                async afterAuth(ctx) {
                    const { shop, accessToken, scope } = ctx.state.shopify
                    // ACTIVE_SHOPIFY_SHOPS[shop] = scope
                    await Shop.updateOne(
                        { shopDomain: shop },
                        { isActive: true }
                    )
                    const response = await Shopify.Webhooks.Registry.register({
                        shop,
                        accessToken,
                        path: '/webhooks',
                        topic: 'APP_UNINSTALLED',
                        webhookHandler: async (topic, shop, body) => {
                            await Shop.updateOne(
                                { shopDomain: shop },
                                { isActive: false }
                            )
                        },
                    })

                    if (!response.success) {
                        console.log(
                            `Failed to register APP_UNINSTALLED webhook: ${response.result}`
                        )
                    }

                    ctx.redirect(`/?shop=${shop}`)
                },
            })
        )

        const handleRequest = async (ctx) => {
            await handle(ctx.req, ctx.res)
            ctx.respond = false
            ctx.res.statusCode = 200
        }

        router.get('/', async (ctx) => {
            const shop = ctx.query.shop
            const existingShop = await Shop.findOne({ shopDomain: shop })

            if (!existingShop || !existingShop.isActive) {
                ctx.redirect(`/auth?shop=${shop}`)
            } else {
                await handleRequest(ctx)
            }
        })

        router.post('/webhooks', async (ctx) => {
            try {
                await Shopify.Webhooks.Registry.process(ctx.req, ctx.res)
                console.log(`Webhook processed, returned status code 200`)
            } catch (error) {
                console.log(`Failed to process webhook: ${error}`)
            }
        })

        router.post(
            '/graphql',
            verifyRequest({ returnHeader: true }),
            async (ctx, next) => {
                await Shopify.Utils.graphqlProxy(ctx.req, ctx.res)
            }
        )

        router.get('(/_next/static/.*)', handleRequest)
        router.get('/_next/webpack-hmr', handleRequest)
        router.all(
            '(/api/.*)',
            async (ctx, next) => {
                try {
                    await verifyRequest({ returnHeader: true })(ctx, next)
                    // await next()
                } catch (error) {
                    if (error instanceof Shopify.Errors.InvalidJwtError) {
                        console.log('E2')
                    } else {
                        throw error
                    }
                }
            },
            handleRequest
        )

        router.get('(.*)', verifyRequest(), handleRequest)

        server.use(router.allowedMethods())
        server.use(router.routes())
        server.listen(port, () => {
            console.log(`> Ready on http://localhost:${port}`)
        })
    })
