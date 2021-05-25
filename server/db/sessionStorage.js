import Session from '../models/session'
import Shop from '../models/shop'

const storeSession = async (session) => {
    try {
        const existingSessionDoc = await findSessionDoc(session.id)
        if (existingSessionDoc) {
            existingSessionDoc.sessionData = session
            await existingSessionDoc.save()
            return true
        }

        if (!session.shop) return false

        let shop

        const existingShop = await Shop.findOne({ shopDomain: session.shop })

        if (existingShop) {
            shop = existingShop
        } else {
            shop = await Shop.create({
                shopDomain: session.shop,
            })
        }

        await Session.create({
            sessionId: session.id,
            sessionData: session,
            shop: shop._id,
        })

        return true
    } catch (e) {
        console.error(e)
        return false
    }
}

const findSessionDoc = async (sessionId) => {
    try {
        const existingSession = await Session.findOne({ sessionId: sessionId })
        return existingSession || undefined
    } catch (e) {
        console.error(e)
        return undefined
    }
}

const loadSession = async (id) => {
    const doc = await findSessionDoc(id)
    return doc?.sessionData
}

const deleteSession = async (id) => {
    try {
        const existingSession = await Session.findOne({ sessionId: id })
        if (!existingSession) return false
        await Session.deleteOne({ sessionId: id })
        return true
    } catch (e) {
        console.error(e)
        return false
    }
}

export { storeSession, loadSession, deleteSession }
