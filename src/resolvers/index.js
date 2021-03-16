import Query from "../query/query"
import Mutation from "../mutations/mutation"
import {GraphQLDateTime} from "graphql-iso-date"

const resolvers ={
    Query,
    Mutation,
    Date: GraphQLDateTime
}

export default resolvers