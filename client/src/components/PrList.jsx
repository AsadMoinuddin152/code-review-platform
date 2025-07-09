// src/components/PrList.jsx

import React from 'react';
import { List, Spin, Typography } from 'antd';
import { useQuery } from '@apollo/client';
import { GET_PULL_REQUESTS } from '../graphql/queries';

const { Text } = Typography;

export default function PrList({ owner, repo, onSelect }) {
  const { data, loading, error } = useQuery(GET_PULL_REQUESTS, {
    variables: { owner, repo },
  });

  if (loading) return <Spin />;
  if (error) return <Text type="danger">Failed to load PRs</Text>;

  return (
    <List
      dataSource={data.pullRequests}
      renderItem={(pr) => (
        <List.Item
          style={{ cursor: 'pointer' }}
          onClick={() => onSelect(pr)}
        >
          #{pr.number} {pr.title}{' '}
          {pr.merged && <Text type="success">Merged</Text>}
        </List.Item>
      )}
    />
  );
}
