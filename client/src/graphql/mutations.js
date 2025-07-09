import { gql } from '@apollo/client';

export const ADD_COMMENT = gql`
  mutation AddComment($prId: String!, $body: String!) {
    addComment(prId: $prId, body: $body) {
      id authorLogin body createdAt
    }
  }
`;

export const GENERATE_SUGGESTIONS = gql`
  mutation GenerateSuggestions($prId: String!, $diff: String!) {
    generateSuggestions(prId: $prId, diff: $diff) {
      id category message line createdAt
    }
  }
`;
