import mongoose, { Schema } from 'mongoose'

export const SessionSchema = new Schema({
    sessionId: {
        type: String,
        unique: true,
        required: true,
        index: true,
    },
    sessionData: {
        type: Object,
    },
    shop: {
        type: mongoose.Schema.Types.ObjectId,
    },
})

const Session = mongoose.model('Session', SessionSchema)

export default Session
