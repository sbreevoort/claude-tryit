const GITHUB_API = 'https://api.github.com';

function getHeaders() {
  return {
    Authorization: `Bearer ${import.meta.env.VITE_GITHUB_TOKEN}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  };
}

export interface CreatedIssue {
  number: number;
  url: string;
  commentId?: number;
}

export interface ExistingIssue {
  number: number;
  title: string;
  body: string;
  url: string;
  state: 'open' | 'closed';
}

export interface LinkedPR {
  number: number;
  title: string;
  url: string;
  state: string;
}

export type AgentStatus = 'pending' | 'in_progress' | 'review' | 'reviewing' | 'ready_to_merge';

export interface IssueStatus {
  state: 'open' | 'closed';
  number: number;
  url: string;
  linkedPRs: LinkedPR[];
  agentStatus: AgentStatus;
}

interface IssueComment {
  id: number;
  body: string;
  user: {
    login: string;
    type: string;
  };
}

function determineAgentStatus(comments: IssueComment[], afterCommentId?: number): AgentStatus {
  const relevant = afterCommentId
    ? comments.filter((c) => c.id > afterCommentId)
    : comments;

  const agentComments = relevant.filter(
    (c) => c.user.type === 'Bot' || c.user.login.endsWith('[bot]')
  );

  if (agentComments.length === 0) return 'pending';

  const isFinished = agentComments.some((c) =>
    c.body.toLowerCase().includes('claude finished')
  );

  return isFinished ? 'review' : 'in_progress';
}

export const createIssue = async (
  repo: string,
  title: string,
  body: string
): Promise<CreatedIssue> => {
  const [owner, repoName] = repo.split('/');
  const response = await fetch(`${GITHUB_API}/repos/${owner}/${repoName}/issues`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ title, body }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message ?? `GitHub API error: ${response.status}`);
  }

  const data = await response.json();
  return { number: data.number, url: data.html_url };
};

export const listIssues = async (repo: string): Promise<ExistingIssue[]> => {
  const [owner, repoName] = repo.split('/');
  const response = await fetch(
    `${GITHUB_API}/repos/${owner}/${repoName}/issues?state=open&per_page=100`,
    { headers: getHeaders() }
  );

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`);
  }

  const data = await response.json();
  return (data as Array<{ number: number; title: string; body: string | null; html_url: string; state: string; pull_request?: unknown }>)
    .filter((item) => !item.pull_request)
    .map((item) => ({
      number: item.number,
      title: item.title,
      body: item.body ?? '',
      url: item.html_url,
      state: item.state as 'open' | 'closed',
    }));
};

export const createIssueComment = async (
  repo: string,
  issueNumber: number,
  body: string
): Promise<CreatedIssue> => {
  const [owner, repoName] = repo.split('/');
  const response = await fetch(
    `${GITHUB_API}/repos/${owner}/${repoName}/issues/${issueNumber}/comments`,
    {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ body }),
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({})) as { message?: string };
    throw new Error(err.message ?? `GitHub API error: ${response.status}`);
  }

  const data = await response.json() as { html_url: string; id: number };
  return { number: issueNumber, url: data.html_url, commentId: data.id };
};

export interface PRCheckStatus {
  number: number;
  url: string;
  prState: 'open' | 'closed';
  merged: boolean;
  agentStatus: AgentStatus;
}

export const createPullRequestForIssue = async (
  repo: string,
  issueNumber: number,
  issueTitle: string
): Promise<LinkedPR> => {
  const [owner, repoName] = repo.split('/');

  // Detect default branch
  const repoRes = await fetch(`${GITHUB_API}/repos/${owner}/${repoName}`, {
    headers: getHeaders(),
  });
  if (!repoRes.ok) throw new Error(`GitHub API error: ${repoRes.status}`);
  const repoData = await repoRes.json() as { default_branch: string };
  const baseBranch = repoData.default_branch;

  // Find the issue branch (pattern: claude/issue-{issueNumber}...)
  const branchPattern = `claude/issue-${issueNumber}`;
  let foundBranch: string | null = null;
  let page = 1;
  while (!foundBranch) {
    const branchRes = await fetch(
      `${GITHUB_API}/repos/${owner}/${repoName}/branches?per_page=100&page=${page}`,
      { headers: getHeaders() }
    );
    if (!branchRes.ok) throw new Error(`GitHub API error: ${branchRes.status}`);
    const branches = await branchRes.json() as Array<{ name: string }>;
    const match = branches.find((b) => b.name.startsWith(branchPattern));
    if (match) { foundBranch = match.name; break; }
    if (branches.length < 100) break;
    page++;
  }

  if (!foundBranch) {
    throw new Error(
      `No branch found for issue #${issueNumber} (expected pattern: ${branchPattern})`
    );
  }

  // Create the PR
  const prRes = await fetch(`${GITHUB_API}/repos/${owner}/${repoName}/pulls`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      title: `Merge: ${issueTitle}`,
      body: `Closes #${issueNumber}`,
      head: foundBranch,
      base: baseBranch,
    }),
  });

  if (!prRes.ok) {
    const err = await prRes.json().catch(() => ({})) as { message?: string };
    throw new Error(err.message ?? `GitHub API error: ${prRes.status}`);
  }

  const pr = await prRes.json() as { number: number; html_url: string; title: string; state: string };
  return { number: pr.number, title: pr.title, url: pr.html_url, state: pr.state };
};

export const fetchPRCheckStatus = async (
  repo: string,
  prNumber: number
): Promise<PRCheckStatus> => {
  const [owner, repoName] = repo.split('/');

  const prRes = await fetch(
    `${GITHUB_API}/repos/${owner}/${repoName}/pulls/${prNumber}`,
    { headers: getHeaders() }
  );
  if (!prRes.ok) throw new Error(`GitHub API error: ${prRes.status}`);

  const pr = await prRes.json() as {
    number: number;
    html_url: string;
    state: string;
    merged: boolean;
    head: { sha: string };
  };

  if (pr.merged) {
    return { number: pr.number, url: pr.html_url, prState: 'closed', merged: true, agentStatus: 'ready_to_merge' };
  }
  if (pr.state === 'closed') {
    return { number: pr.number, url: pr.html_url, prState: 'closed', merged: false, agentStatus: 'reviewing' };
  }

  // Check check-runs for head SHA
  const checksRes = await fetch(
    `${GITHUB_API}/repos/${owner}/${repoName}/commits/${pr.head.sha}/check-runs?per_page=100`,
    { headers: getHeaders() }
  );

  if (!checksRes.ok) {
    return { number: pr.number, url: pr.html_url, prState: 'open', merged: false, agentStatus: 'reviewing' };
  }

  const checksData = await checksRes.json() as {
    check_runs: Array<{ status: string; conclusion: string | null }>;
  };
  const runs = checksData.check_runs;

  if (runs.length === 0) {
    return { number: pr.number, url: pr.html_url, prState: 'open', merged: false, agentStatus: 'reviewing' };
  }

  const allComplete = runs.every((r) => r.status === 'completed');
  const allPassed =
    allComplete &&
    runs.every(
      (r) => r.conclusion === 'success' || r.conclusion === 'skipped' || r.conclusion === 'neutral'
    );

  return {
    number: pr.number,
    url: pr.html_url,
    prState: 'open',
    merged: false,
    agentStatus: allPassed ? 'ready_to_merge' : 'reviewing',
  };
};

export const mergePullRequest = async (repo: string, prNumber: number): Promise<void> => {
  const [owner, repoName] = repo.split('/');
  const res = await fetch(
    `${GITHUB_API}/repos/${owner}/${repoName}/pulls/${prNumber}/merge`,
    {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ merge_method: 'squash' }),
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(err.message ?? `GitHub API error: ${res.status}`);
  }
};

export const fetchIssueStatus = async (
  repo: string,
  issueNumber: number,
  afterCommentId?: number
): Promise<IssueStatus> => {
  const [owner, repoName] = repo.split('/');

  const [issueRes, commentsRes, searchRes] = await Promise.all([
    fetch(`${GITHUB_API}/repos/${owner}/${repoName}/issues/${issueNumber}`, {
      headers: getHeaders(),
    }),
    fetch(
      `${GITHUB_API}/repos/${owner}/${repoName}/issues/${issueNumber}/comments?per_page=100`,
      { headers: getHeaders() }
    ),
    fetch(
      `${GITHUB_API}/search/issues?q=is:pr+repo:${owner}/${repoName}+%23${issueNumber}`,
      { headers: getHeaders() }
    ),
  ]);

  if (!issueRes.ok) {
    throw new Error(`GitHub API error: ${issueRes.status}`);
  }

  const issue = await issueRes.json();

  const comments: IssueComment[] = commentsRes.ok ? await commentsRes.json() : [];
  const agentStatus = determineAgentStatus(comments, afterCommentId);

  const linkedPRs: LinkedPR[] = [];
  if (searchRes.ok) {
    const searchData = await searchRes.json();
    for (const item of searchData.items ?? []) {
      if (item.pull_request) {
        linkedPRs.push({
          number: item.number,
          title: item.title,
          url: item.html_url,
          state: item.state,
        });
      }
    }
  }

  return {
    state: issue.state as 'open' | 'closed',
    number: issue.number,
    url: issue.html_url,
    linkedPRs,
    agentStatus,
  };
};
