import mongoose, { Schema } from 'mongoose'
import { fieldTypes } from '../../helpers/constants'

const FieldSchema = new Schema({
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

const ShopSchema = new Schema({
    // shopId: {
    //     type: Number,
    //     unique: true,
    //     required: true,
    // },
    shopDomain: {
        type: String,
        unique: true,
        required: true,
        index: true,
    },
    // nonce: String,
    // accessToken: String,
    isActive: {
        type: Boolean,
        default: false,
    },
    fields: [FieldSchema],
})

const Shop = mongoose.models.Shop || mongoose.model('Shop', ShopSchema)

export default Shop
