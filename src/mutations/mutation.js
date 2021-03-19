import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import {randomBytes} from "crypto"
import User from "../models/user"
import Product from "../models/product"
import CartItem from "../models/cartItem"
import sgMail from "@sendgrid/mail"

const Mutation = {
  signup: async (parent, args, context, info) => {
    // Trim and lower case email
    const email = args.email.trim().toLowerCase()

    // Check if email already exist in database
    const currentUsers = await User.find({})
    const isEmailExist =
      currentUsers.findIndex(user => user.email === email) > -1

    if (isEmailExist) {
      throw new Error("Email already exist.")
    }

    // Validate password
    if (args.password.trim().length < 6) {
      throw new Error("Password must be at least 6 characters.")
    }

    const password = await bcrypt.hash(args.password, 10)

    return User.create({ ...args, email, password })
  },
  login: async (parent, args, context, info) => {
    const {email,password} = args

    const user = await User.findOne({email})     
    .populate({
      path: "products",
      populate: { path: "user" }
    })
    .populate({ path: "carts", populate: { path: "product" } })

    if(!user){
      throw new Error("Email not found")
    }

    const validPassword = await bcrypt.compare(password,user.password)

    if(!validPassword){
      throw new Error("Password is wrong")
    }
    
    const token = jwt.sign({userId: user.id}, process.env.SECRET , {expiresIn: '7days'})

    return {user,jwt:token}
  },
  requsetResetPassword: async(parent,{email},context,info) =>{
    const user = await User.findOne({email})

    if(!user){
      throw new Error('Email not Found')
    }

    const resetPasswordToken = randomBytes(32).toString('hex')

    const resetTokenExpiry = Date.now() + 30 * 60 * 1000

    await User.findByIdAndUpdate(user.id,{
      resetPasswordToken,
      resetTokenExpiry
    })

    sgMail.setApiKey(process.env.EMAIL_API)
    const msg ={
      to : user.email,
      from : 'oofza93@gmail.com',
      subject : 'Reset Password Link',
      html : `
        <div>
          <p>Please Click the link to reset your password</p> \n\n
          <a href='http://localhost:3000/signin/resetpassword?resetToken=${resetPasswordToken}'
          target='blank' style={{color: 'blue'}}>Click to reset password</a>
        </div>
        `
    };

    sgMail.send(msg).then(() => {}, error => {
    console.error(error);

    if (error.response) {
      console.error(error.response.body)
    }
  });

    return {massage: 'Pls check your email' }
  },
  createProduct: async (parent, args, {userId}, info) => {
    // const userId = "60504f01b9606c4de06fe39f"

    if(!userId) throw new Error('Pls Login')

    if (!args.description || !args.price || !args.imageUrl) {
      throw new Error("Please provide all required fields.")
    }

    const product = await Product.create({ ...args, user: userId })
    const user = await User.findById(userId)

    if (!user.products) {
      user.products = [product]
    } else {
      user.products.push(product)
    }

    await user.save()

    return Product.findById(product.id).populate({
      path: "user",
      populate: { path: "products" }
    })
  },
  updateProduct: async (parent, args, {userId}, info) => {
    const {id,description,price,imageUrl} = args

    if(!userId)throw new Error('Pls Login')

    const product = await Product.findById(id)

    // const UserID = "60504f01b9606c4de06fe39f"

    if(userId !== product.user.toString()){
      throw new Error('You not permission')
    }

    const updateinfo ={
      description: !!description ? description : product.description,
      price : !!price ? price : product.price,
      imageUrl :!!imageUrl ? imageUrl : product.imageUrl
    }

    await Product.findByIdAndUpdate(id,updateinfo)

    const updatedProduct = await Product.findById(id).populate({
      path : "user"
    })
    return updatedProduct
  },
  addToCart: async (parent, args, {userId}, info) => {
    // id --> productId
    const { id } = args

    if(!userId) throw new Error("Pls Login")

    try {
      
      // Check if the new addToCart item is already in user.carts
      const user = await User.findById(userId).populate({
        path: "carts",
        populate: { path: "product" }
      })

      const findCartItemIndex = user.carts.findIndex(
        cartItem => cartItem.product.id === id
      )

      if (findCartItemIndex > -1) {
        // A. The new addToCart item is already in cart
        // A.1 Find the cartItem and update in database
        user.carts[findCartItemIndex].quantity += 1

        await CartItem.findByIdAndUpdate(user.carts[findCartItemIndex].id, {
          quantity: user.carts[findCartItemIndex].quantity
        })

        // A.2 Find updated cartItem
        const updatedCartItem = await CartItem.findById(
          user.carts[findCartItemIndex].id
        )
          .populate({ path: "product" })
          .populate({ path: "user" })

        return updatedCartItem
      } else {
        // B. The new addToCart item is not in cart yet
        // B.1 Create new cartItem
        const cartItem = await CartItem.create({
          product: id,
          quantity: 1,
          user: userId
        })

        // B.2 find new cartItem
        const newCartItem = await CartItem.findById(cartItem.id)
          .populate({ path: "product" })
          .populate({ path: "user" })

        // B.2 Update user.carts
        await User.findByIdAndUpdate(userId, {
          carts: [...user.carts, newCartItem]
        })

        return newCartItem
      }
    } catch (error) {
      console.log(error)
    }
  },
  deleteCart: async (parent,args,{userId},info) => {
    const {id} = args

    const cart = await CartItem.findById(id)

    if(!userId) throw new Error('Pls Login')

    const user = await User.findById(userId)

    if(cart.user.toString() !== userId) throw new Error('Not Authorize')

    const deleteCart = await CartItem.findOneAndRemove(id)

    const updateUserCart = user.carts.filter(cartId => cartId.toString() !== deleteCart.id.toString())

    await User.findByIdAndUpdate(userId,{carts: updateUserCart})

    return deleteCart
  }
}

export default Mutation
