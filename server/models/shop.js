import mongoose, { Schema } from 'mongoose'
import { fieldTypes } from '../../lib/constants'
import { FieldSchema } from './field'

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

const Shop = mongoose.model('Shop', ShopSchema)

export default Shop
