// src/App.jsx

import React, { useState, useEffect } from 'react';
import {
  Layout,
  Menu,
  Button,
  Avatar,
  Typography,
  Spin,
  message,
} from 'antd';
import {
  LogoutOutlined,
  GithubOutlined,
} from '@ant-design/icons';
import { client } from './apollo/client';
import { GET_ME } from './graphql/queries';
import RepoList from './components/RepoList';
import PrList from './components/PrList';
import CommentsPanel from './components/CommentsPanel';
import SuggestionsPanel from './components/SuggestionsPanel';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

export default function App() {
  const [jwt, setJwt] = useState(null);
  const [user, setUser] = useState(null);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [selectedPr, setSelectedPr] = useState(null);

  // on mount, grab JWT & fetch profile
  useEffect(() => {
    const token = localStorage.getItem('code-review-platform');
    if (token) {
      setJwt(token);
      client
        .query({ query: GET_ME })
        .then(({ data }) => {
          if (data.me) {
            setUser(data.me);
            message.success(`Welcome back, ${data.me.login}!`);
          }
        })
        .catch((err) => {
          message.error(`Error loading profile: ${err.message}`);
        });
    }
  }, []);

  const handleLogin = () => {
    window.location.href = import.meta.env.VITE_OAUTH_URL;
  };

  const handleLogout = () => {
    localStorage.removeItem('code-review-platform');
    setJwt(null);
    setUser(null);
    setSelectedRepo(null);
    setSelectedPr(null);
    message.info('Logged out');
  };

  if (!jwt) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Content
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Button
            type="primary"
            size="large"
            icon={<GithubOutlined />}
            onClick={handleLogin}
          >
            Login with GitHub
          </Button>
        </Content>
      </Layout>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Header */}
      <Header
        style={{
          background: '#fff',
          padding: '0 16px',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <Title level={4} style={{ margin: 0 }}>
          Code Review Platform
        </Title>
        <div>
          {user && (
            <Avatar src={user.avatarUrl} style={{ marginRight: 8 }} />
          )}
          <Button
            icon={<LogoutOutlined />}
            onClick={handleLogout}
          >
            Logout
          </Button>
        </div>
      </Header>

      <Layout>
        {/* Sidebar: Repos */}
        <Sider width={280} style={{ background: '#fff', padding: '16px' }}>
          <Title level={5}>Your Repositories</Title>
          <RepoList
            onSelect={(r) => {
              setSelectedRepo(r);
              setSelectedPr(null);
            }}
          />
        </Sider>

        {/* Main: PR List */}
        <Content style={{ padding: '16px', background: '#f0f2f5' }}>
          {selectedRepo ? (
            <>
              <Title level={5}>
                PRs in {selectedRepo.ownerLogin}/{selectedRepo.name}
              </Title>
              <PrList
                owner={selectedRepo.ownerLogin}
                repo={selectedRepo.name}
                onSelect={(pr) => setSelectedPr(pr)}
              />
            </>
          ) : (
            <Text type="secondary">
              Select a repository to view pull requests.
            </Text>
          )}
        </Content>

        {/* Right Panel: Comments & Suggestions */}
        <Sider width={360} style={{ background: '#fff', padding: '16px' }}>
          {selectedPr ? (
            <>
              <Title level={5}>
                PR #{selectedPr.number}: {selectedPr.title}
              </Title>
              <CommentsPanel prId={selectedPr.id} />
              <SuggestionsPanel prId={selectedPr.id} />
            </>
          ) : (
            <Text type="secondary">
              Select a pull request to review.
            </Text>
          )}
        </Sider>
      </Layout>
    </Layout>
  );
}
