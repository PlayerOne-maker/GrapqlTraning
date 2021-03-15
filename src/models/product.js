import mongoose from "mongoose"


const productSchema = new mongoose.Schema({
    name :{
        type: String,
        require: true,
        trim: true
    },
    price :{
        type: Number,
        require: true,
        trim: true
    },
    imageUrl :{
        type: String,
        require: true,
        trim: true
    },
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref : 'User',
        require: true
    }
})

const Product = mongoose.model('Product',productSchema)

export default Product