import Shop from '../../server/models/shop'
import Shopify from '@shopify/shopify-api'

export default async function handler(req, res) {
    try {
        if (req.method !== 'GET') return res.status(405).json({ error: null })

        const session = await Shopify.Utils.loadCurrentSession(req, res)
        const shopDoc = await Shop.findOne({ shopDomain: session.shop })

        if (!shopDoc) return res.status(401).json({ error: null })

        return res.status(200).json(shopDoc.fields)
    } catch (e) {
        return res.status(500).json({ error: null })
    }
}
