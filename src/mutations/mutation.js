import User from "../models/user"
import bcrypt from "bcryptjs"
import Product from "../models/product"

const Mutation = {
    signup: async (parent,args,context,info) => {
        const email = args.email.trim().toLowerCase()
        const currentUser = await User.find({})
        const isEmailExist = currentUser.findIndex(user => user.email === email ) > -1

        if(isEmailExist){
            throw new Error('Email already exist')
        }

        if (args.password.trim().length < 6 ){
            throw new Error('Password Must be at least 6 characters')
        }


        const password = await bcrypt.hash(args.password,10)
        return User.create({...args,email,password})
    },
    createProduct: async (parent,args,context,info) =>{ 
        const userId = "604f3105a7b3972e0c8b00e5"

        if (!args.name || !args.price || !args.imageUrl){
            throw new Error('Please input data.')
        }

        const product = await Product.create({...args,user: userId})
        const user = await User.findById(userId)
        
        if(!user.products){
            user.products = [product]
        }else{
            user.products.push(product)
        }

        await user.save()

        return Product.findById(product.id).populate({
            path: 'user',
            populate:{path:"products"}})
    }
}

export default Mutation