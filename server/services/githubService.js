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

async function listUserRepos(
  token,
  page = 1,
  perPage = 10,
  sort = "created",
  order = "desc"
) {
  if (!token) throw new Error("Not authenticated");
  const p = Math.max(1, parseInt(page, 10));
  const pp = Math.min(100, Math.max(1, parseInt(perPage, 10)));
  const url =
    `https://api.github.com/user/repos` +
    `?page=${p}&per_page=${pp}&sort=${sort}&direction=${order}`;
  const { data } = await axios.get(url, {
    headers: { Authorization: `token ${token}` },
  });
  return data.map((r) => ({
    id: r.id.toString(),
    name: r.name,
    ownerLogin: r.owner.login,
  }));
}

async function listPullRequests(
  githubToken,
  ownerLogin,
  repoName,
  state = "open",
  page = 1,
  perPage = 10,
  sort = "created",
  order = "desc"
) {
  if (!githubToken) throw new Error("Not authenticated");
  if (!["open", "closed", "all"].includes(state)) {
    console.error("Invalid state:", state);
    throw new Error("Invalid state; must be open, closed, or all");
  }
  const p = Math.max(1, parseInt(page, 10));
  const pp = Math.min(100, Math.max(1, parseInt(perPage, 10)));
  const url =
    `https://api.github.com/repos/${ownerLogin}/${repoName}/pulls` +
    `?state=${state}&page=${p}&per_page=${pp}` +
    `&sort=${sort}&direction=${order}`;
  const { data } = await axios.get(url, {
    headers: { Authorization: `token ${githubToken}` },
  });
  return data.map((pr) => ({
    id: pr.id.toString(),
    number: pr.number,
    title: pr.title,
    authorLogin: pr.user.login,
    merged: pr.merged_at !== null,
    createdAt: pr.created_at,
  }));
}

module.exports = { getOrCreateUser, listUserRepos, listPullRequests };
