import { ApolloClient, HttpLink, InMemoryCache, split } from '@apollo/client'
import { WebSocketLink } from '@apollo/client/link/ws'
import { getMainDefinition } from '@apollo/client/utilities'

const httpLink = new HttpLink({
  uri: 'http://localhost:8000/graphql', // Backend HTTP GraphQL URL
})

const wsLink =
  typeof window !== 'undefined'
    ? new WebSocketLink({
        uri: 'ws://localhost:8000/graphql', // WebSocket URL (fixed quotes)
        options: {
          reconnect: true,
        },
      })
    : null

const splitLink =
  typeof window !== 'undefined' && wsLink
    ? split(
        ({ query }) => {
          const definition = getMainDefinition(query)
          return (
            definition.kind === 'OperationDefinition' &&
            definition.operation === 'subscription'
          )
        },
        wsLink,
        httpLink
      )
    : httpLink

const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
})

export default client
