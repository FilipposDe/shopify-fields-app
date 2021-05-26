import Shopify from '@shopify/shopify-api'
import Shop from '../../../server/models/shop'

export default async function handler(req, res) {
    try {
        if (!['GET', 'PUT'].includes(req.method)) return res.status(405).end()

        const { id: docId } = req.query
        if (!docId) return res.status(400).end()
        const session = await Shopify.Utils.loadCurrentSession(req, res)
        const shopDoc = await Shop.findOne({ shopDomain: session.shop })

        if (!shopDoc) return res.status(401).end()

        const allFields = shopDoc.fields
        const foundField = await allFields.id(docId)
        if (!foundField) return res.status(404).end()

        switch (req.method) {
            case 'GET': {
                return res.status(200).json(foundField)
            }
            case 'PUT': {
                const { name, type, description } = req.body
                if (
                    name !== foundField.name ||
                    description !== foundField.description ||
                    type !== foundField.type
                ) {
                    foundField.name = name
                    foundField.type = type
                    foundField.description = description
                    await shopDoc.save()
                }
                return res.status(200).end()
            }
        }
    } catch (e) {
        console.log(e)
        return res.status(500).end()
    }
}
