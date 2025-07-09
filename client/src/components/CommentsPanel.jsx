// src/components/CommentsPanel.jsx

import React, { useState, useEffect } from 'react';
import { List, Input, Button, Spin, Typography, message } from 'antd';
import { useQuery, useMutation } from '@apollo/client';
import { GET_COMMENTS } from '../graphql/queries';
import { ADD_COMMENT } from '../graphql/mutations';
import { COMMENT_ADDED } from '../graphql/subscriptions';

const { Text } = Typography;
const { TextArea } = Input;

export default function CommentsPanel({ prId }) {
  const { data, loading, error, subscribeToMore } = useQuery(GET_COMMENTS, {
    variables: { prId },
  });
  const [body, setBody] = useState('');
  const [addComment, { loading: adding }] = useMutation(ADD_COMMENT, {
    onCompleted: () => {
      message.success('Comment added!');
      setBody('');
    },
    onError: (err) => message.error(err.message),
  });

  useEffect(() => {
    const unsubscribe = subscribeToMore({
      document: COMMENT_ADDED,
      variables: { prId },
      updateQuery: (prev, { subscriptionData }) => {
        if (!subscriptionData.data) return prev;
        return {
          comments: [...prev.comments, subscriptionData.data.commentAdded],
        };
      },
    });
    return () => unsubscribe();
  }, [prId, subscribeToMore]);

  if (loading) return <Spin />;
  if (error) return <Text type="danger">Failed to load comments</Text>;

  return (
    <div>
      <List
        dataSource={data.comments}
        renderItem={(c) => (
          <List.Item>
            <List.Item.Meta
              title={<Text strong>{c.authorLogin}</Text>}
              description={
                <>
                  <Text>{c.body}</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {new Date(c.createdAt).toLocaleString()}
                  </Text>
                </>
              }
            />
          </List.Item>
        )}
      />
      <TextArea
        rows={3}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Add a comment..."
        style={{ marginTop: 8, marginBottom: 8 }}
      />
      <Button
        type="primary"
        loading={adding}
        onClick={() => addComment({ variables: { prId, body } })}
      >
        Submit
      </Button>
    </div>
  );
}
