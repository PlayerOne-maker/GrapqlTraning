
import fs from "fs"
import path from "path"
import { ApolloServer } from 'apollo-server-express'
// import typeDefs from './schema/typeDefs'
import resolvers from './resolvers'
import getUser from './util/getUser'

const typeDefs = fs.readFileSync(path.join(__dirname, "./schema" ,"schema.graphql"),"utf-8").toString()

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context:({req}) =>{
    const token = req.headers.authorization || ''

    const userId = getUser(token)
    console.log(userId)
    return {userId}
  }
});

export default server