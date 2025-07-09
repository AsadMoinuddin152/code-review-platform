import { gql } from '@apollo/client';

export const COMMENT_ADDED = gql`
  subscription CommentAdded($prId: ID!) {
    commentAdded(prId: $prId) {
      id authorLogin body createdAt
    }
  }
`;

export const SUGGESTION_ADDED = gql`
  subscription SuggestionAdded($prId: ID!) {
    suggestionAdded(prId: $prId) {
      id category message line createdAt
    }
  }
`;
