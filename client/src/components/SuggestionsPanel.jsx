// src/components/SuggestionsPanel.jsx

import React, { useState, useEffect } from 'react';
import { List, Button, Spin, Typography, message } from 'antd';
import { useQuery, useMutation } from '@apollo/client';
import { GET_SUGGESTIONS } from '../graphql/queries';
import { GENERATE_SUGGESTIONS } from '../graphql/mutations';
import { SUGGESTION_ADDED } from '../graphql/subscriptions';

const { Text } = Typography;

export default function SuggestionsPanel({ prId }) {
  const { data, loading, error, subscribeToMore } = useQuery(GET_SUGGESTIONS, {
    variables: { prId },
  });
  const [generating, setGenerating] = useState(false);
  const [generate] = useMutation(GENERATE_SUGGESTIONS, {
    onCompleted: () => {
      message.success('Suggestions generated!');
      setGenerating(false);
    },
    onError: (err) => {
      message.error(err.message);
      setGenerating(false);
    },
  });

  useEffect(() => {
    const unsubscribe = subscribeToMore({
      document: SUGGESTION_ADDED,
      variables: { prId },
      updateQuery: (prev, { subscriptionData }) => {
        if (!subscriptionData.data) return prev;
        return {
          suggestions: [
            ...prev.suggestions,
            subscriptionData.data.suggestionAdded,
          ],
        };
      },
    });
    return () => unsubscribe();
  }, [prId, subscribeToMore]);

  if (loading) return <Spin />;
  if (error) return <Text type="danger">Failed to load suggestions</Text>;

  return (
    <div style={{ marginTop: 16 }}>
      <Button
        type="default"
        loading={generating}
        onClick={() => {
          setGenerating(true);
          generate({ variables: { prId, diff: '' } });
        }}
      >
        Generate AI Suggestions
      </Button>
      <List
        dataSource={data.suggestions}
        renderItem={(s) => (
          <List.Item>
            <List.Item.Meta
              title={<Text type="secondary">{s.category.toUpperCase()}</Text>}
              description={s.message}
            />
            <Text type="secondary">Line {s.line}</Text>
          </List.Item>
        )}
        style={{ marginTop: 8 }}
      />
    </div>
  );
}
