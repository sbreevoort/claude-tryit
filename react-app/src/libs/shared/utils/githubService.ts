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

export type AgentStatus = 'pending' | 'in_progress' | 'review';

export interface IssueStatus {
  state: 'open' | 'closed';
  number: number;
  url: string;
  linkedPRs: LinkedPR[];
  agentStatus: AgentStatus;
}

interface IssueComment {
  body: string;
  user: {
    login: string;
    type: string;
  };
}

function determineAgentStatus(comments: IssueComment[]): AgentStatus {
  const agentComments = comments.filter(
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

  const data = await response.json() as { html_url: string };
  return { number: issueNumber, url: data.html_url };
};

export const fetchIssueStatus = async (
  repo: string,
  issueNumber: number
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
  const agentStatus = determineAgentStatus(comments);

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
