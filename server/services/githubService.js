const axios = require("axios");

async function getOrCreateUser(token) {
  if (!token) return null;
  const { data } = await axios.get("https://api.github.com/user", {
    headers: { Authorization: `token ${token}` },
  });
  return {
    id: data.id.toString(),
    login: data.login,
    avatarUrl: data.avatar_url,
  };
}

async function listUserRepos(token) {
  if (!token) throw new Error("Not authenticated");
  const { data } = await axios.get("https://api.github.com/user/repos", {
    headers: { Authorization: `token ${token}` },
  });
  return data.map((r) => ({
    id: r.id.toString(),
    name: r.name,
    ownerLogin: r.owner.login,
  }));
}

async function listPullRequests(githubToken, ownerLogin, repoName) {
  if (!githubToken) throw new Error("Not authenticated");
  const { data } = await axios.get(
    `https://api.github.com/repos/${ownerLogin}/${repoName}/pulls`,
    { headers: { Authorization: `token ${githubToken}` } }
  );
  return data.map((pr) => ({
    id: pr.id.toString(),
    number: pr.number,
    title: pr.title,
    authorLogin: pr.user.login,
    merged: pr.merged,
    createdAt: pr.created_at,
  }));
}

module.exports = { getOrCreateUser, listUserRepos, listPullRequests };
