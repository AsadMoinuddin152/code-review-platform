import { gql } from '@apollo/client';

export const GET_ME = gql`
  query {
    me { id login avatarUrl }
  }
`;

export const GET_REPOS = gql`
  query Repos($page: Int!, $perPage: Int!) {
    repos(page: $page, perPage: $perPage) {
      id name ownerLogin
    }
  }
`;

export const GET_PULL_REQUESTS = gql`
  query PullRequests($owner: String!, $repo: String!) {
    pullRequests(ownerLogin: $owner, repoName: $repo) {
      id number title authorLogin merged createdAt
    }
  }
`;

export const GET_COMMENTS = gql`
  query Comments($prId: ID!) {
    comments(prId: $prId) {
      id authorLogin body createdAt
    }
  }
`;

export const GET_SUGGESTIONS = gql`
  query Suggestions($prId: ID!) {
    suggestions(prId: $prId) {
      id category message line createdAt
    }
  }
`;
