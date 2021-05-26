import Shopify from '@shopify/shopify-api'
import mongoose from 'mongoose'
import Shop from '../../../server/models/shop'

export default async function handler(req, res) {
    try {
        if (req.method !== 'POST') return res.status(405).end()

        const { name, type, description } = req.body
        if (!name || !type)
            return res.status(404).json({ error: 'Name and Type are required' })

        const session = await Shopify.Utils.loadCurrentSession(req, res)
        const shopDoc = await Shop.findOne({ shopDomain: session.shop })

        if (!shopDoc) return res.status(401).end()

        if (shopDoc.fields.some((field) => field.name === name))
            return res
                .status(409)
                .json({ error: `Field with name: "${name}" already exists` })

        shopDoc.fields.push({
            name,
            type,
            description,
        })

        const newFieldDoc = shopDoc.fields[shopDoc.fields.length - 1]

        await shopDoc.save()
        return res.status(200).json({ id: newFieldDoc._id })
    } catch (e) {
        if (e instanceof mongoose.Error.ValidationError) {
            return res.status(400).json({ error: e.message })
        }

        return res.status(500).end()
    }
}
