import mongoose, { Schema } from 'mongoose'
import { fieldTypes } from '../../lib/constants'

export const FieldSchema = new Schema({
    name: {
        type: String,
        trim: true,
        unique: true,
        required: true,
        maxlength: 30,
        minlength: 3,
        index: true,
    },
    description: {
        type: String,
        trim: true,
        maxlength: 300,
    },
    type: {
        type: String,
        enum: Object.values(fieldTypes),
        default: fieldTypes.TEXT,
    },
})

const Field = mongoose.model('Field', FieldSchema)

export default Field
