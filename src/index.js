import express from "express"
import server from "./server"
import mongoose from "mongoose"
import dotenv from "dotenv"
dotenv.config()

const {DB_Name,DB_Password,DB_Username,Port} = process.env

const createServer = async() =>{
    try{

        await mongoose.connect(`mongodb+srv://${DB_Username}:${DB_Password}@grapql.c0ulb.mongodb.net/
        ${DB_Name}?retryWrites=true&w=majority`,
        { useUnifiedTopology: true ,writeConcern: { w: null } }
        )
        
        const app = express();
        
        server.applyMiddleware({ app });

        app.listen({ port: Port }, () =>
        console.log(`🚀 Server ready at http://localhost:${Port}${server.graphqlPath}`)
        )
    }catch(error){
        console.log("Can't connect DB")
    }
}


createServer()
