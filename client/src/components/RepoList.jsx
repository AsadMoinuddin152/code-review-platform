// src/components/RepoList.jsx

import React from 'react';
import { List, Spin, Typography } from 'antd';
import { useQuery } from '@apollo/client';
import { GET_REPOS } from '../graphql/queries';

const { Text } = Typography;

export default function RepoList({ onSelect }) {
  const { data, loading, error } = useQuery(GET_REPOS, {
    variables: { page: 1, perPage: 5 },
  });

  if (loading) return <Spin />;
  if (error) return <Text type="danger">Failed to load repos</Text>;

  return (
    <List
      dataSource={data.repos}
      renderItem={(repo) => (
        <List.Item
          style={{ cursor: 'pointer' }}
          onClick={() => onSelect(repo)}
        >
          {repo.ownerLogin}/{repo.name}
        </List.Item>
      )}
    />
  );
}
