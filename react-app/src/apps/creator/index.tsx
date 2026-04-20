import { useState, useEffect, useRef, type ReactNode } from 'react';
import { useMutation } from '@tanstack/react-query';
import type { AppComponentProps } from '../../Applications';
import { Button } from '../../libs/shared/components';
import {
  createIssue,
  createIssueComment,
  fetchIssueStatus,
  listIssues,
} from '../../libs/shared/utils/githubService';
import type { AgentStatus, CreatedIssue, ExistingIssue, IssueStatus } from '../../libs/shared/utils/githubService';
import './Creator.css';

const GITHUB_REPO = 'sbreevoort/claude-tryit';

interface GeneratedContent {
  title: string;
  body: string;
}

type Mode = 'new' | 'existing' | null;
type Step = 'choice' | 'select' | 'input' | 'review' | 'tracking';

const NEW_STEPS: Step[] = ['choice', 'input', 'review', 'tracking'];
const EXISTING_STEPS: Step[] = ['choice', 'select', 'review', 'tracking'];

const STEP_LABELS: Record<Step, string> = {
  choice: 'Choose Mode',
  select: 'Select Idea',
  input: 'Idea Input',
  review: 'Review & Edit',
  tracking: 'Status Tracker',
};

function getSteps(mode: Mode): Step[] {
  return mode === 'existing' ? EXISTING_STEPS : NEW_STEPS;
}

function stepIndex(step: Step, mode: Mode): number {
  return getSteps(mode).indexOf(step);
}

const generateIssue = async (idea: string): Promise<GeneratedContent> => {
  const response = await fetch('/api/anthropic/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content:
            `You are a technical product manager for the AI Application Portal (AAP). ` +
            `Transform the following app idea into a structured feature request. ` +
            `Return ONLY a valid JSON object with exactly two keys: ` +
            `"title" (concise idea title, no markdown) and ` +
            `"body" (complete idea request body in Markdown with sections: ` +
            `## Description, ## Requirements, ## Implementation Steps, ## Acceptance Criteria). ` +
            `App idea: ${idea}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const rawText: string = data.content[0].text;
  const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonString = jsonMatch ? jsonMatch[1].trim() : rawText.trim();
  return JSON.parse(jsonString) as GeneratedContent;
};

const generateRefinement = async (
  existingIssue: ExistingIssue,
  refinementIdea: string
): Promise<GeneratedContent> => {
  const response = await fetch('/api/anthropic/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content:
            `You are a technical product manager for the AI Application Portal (AAP). ` +
            `Given an existing GitHub issue and a user's refinement idea, generate a helpful comment that refines or extends the issue. ` +
            `Return ONLY a valid JSON object with exactly two keys: ` +
            `"title" (brief summary of the refinement, no markdown) and ` +
            `"body" (the comment in Markdown format, well-structured and detailed). ` +
            `Existing issue title: ${existingIssue.title}\n` +
            `Existing issue description: ${existingIssue.body.slice(0, 2000)}\n\n` +
            `User's refinement idea: ${refinementIdea}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const rawText: string = data.content[0].text;
  const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonString = jsonMatch ? jsonMatch[1].trim() : rawText.trim();
  return JSON.parse(jsonString) as GeneratedContent;
};

const AGENT_STATUS_CONFIG: Record<AgentStatus, { label: string; icon: ReactNode }> = {
  pending: { label: 'Waiting for Claude...', icon: '⏳' },
  in_progress: { label: 'Claude is building...', icon: <span className="creator__spinner" /> },
  review: { label: 'Code ready for review', icon: '✓' },
};

function AgentStatusRow({ agentStatus }: { agentStatus: AgentStatus }) {
  const { label, icon } = AGENT_STATUS_CONFIG[agentStatus];
  return (
    <div className={`creator__agent-status creator__agent-status--${agentStatus}`}>
      <span className="creator__agent-status-icon" aria-hidden="true">{icon}</span>
      <div>
        <span className="creator__tracker-label">Agent Status</span>
        <span className="creator__agent-status-text">{label}</span>
      </div>
    </div>
  );
}

export const CreatorApp = (_props: AppComponentProps) => {
  const [step, setStep] = useState<Step>('choice');
  const [mode, setMode] = useState<Mode>(null);

  // New idea state
  const [idea, setIdea] = useState('');

  // Existing idea state
  const [issues, setIssues] = useState<ExistingIssue[]>([]);
  const [issueSearch, setIssueSearch] = useState('');
  const [selectedIssue, setSelectedIssue] = useState<ExistingIssue | null>(null);
  const [refinementIdea, setRefinementIdea] = useState('');
  const [isLoadingIssues, setIsLoadingIssues] = useState(false);

  // Review state
  const [editedTitle, setEditedTitle] = useState('');
  const [editedBody, setEditedBody] = useState('');

  // Tracking state
  const [published, setPublished] = useState<CreatedIssue | null>(null);
  const [refinementCommentId, setRefinementCommentId] = useState<number | null>(null);
  const [issueStatus, setIssueStatus] = useState<IssueStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (step !== 'select') return;
    setIsLoadingIssues(true);
    listIssues(GITHUB_REPO)
      .then(setIssues)
      .catch((err: Error) => setError(`Failed to load ideas: ${err.message}`))
      .finally(() => setIsLoadingIssues(false));
  }, [step]);

  const { mutate: generate, isPending: isGenerating } = useMutation({
    mutationFn: generateIssue,
    onSuccess: (data) => {
      setEditedTitle(data.title);
      setEditedBody(data.body);
      setStep('review');
      setError(null);
    },
    onError: (err: Error) => {
      setError(`Failed to generate idea: ${err.message}`);
    },
  });

  const { mutate: generateRef, isPending: isGeneratingRef } = useMutation({
    mutationFn: () => {
      if (!selectedIssue) throw new Error('No idea selected');
      return generateRefinement(selectedIssue, refinementIdea);
    },
    onSuccess: (data) => {
      setEditedTitle(data.title);
      setEditedBody(data.body);
      setStep('review');
      setError(null);
    },
    onError: (err: Error) => {
      setError(`Failed to generate refinement: ${err.message}`);
    },
  });

  const { mutate: publish, isPending: isPublishing } = useMutation({
    mutationFn: () => {
      const bodyWithTrigger = `Hey @claude!\n\n${editedBody}`;
      return createIssue(GITHUB_REPO, editedTitle, bodyWithTrigger);
    },
    onSuccess: (data) => {
      setPublished(data);
      setStep('tracking');
      setError(null);
    },
    onError: (err: Error) => {
      setError(`Failed to submit idea: ${err.message}`);
    },
  });

  const { mutate: submitComment, isPending: isSubmittingComment } = useMutation({
    mutationFn: () => {
      if (!selectedIssue) throw new Error('No idea selected');
      const bodyWithTrigger = `Hey @claude!\n\n${editedBody}`;
      return createIssueComment(GITHUB_REPO, selectedIssue.number, bodyWithTrigger);
    },
    onSuccess: (data) => {
      setPublished(data);
      setRefinementCommentId(data.commentId ?? null);
      setStep('tracking');
      setError(null);
    },
    onError: (err: Error) => {
      setError(`Failed to submit comment: ${err.message}`);
    },
  });

  useEffect(() => {
    if (step !== 'tracking' || !published) return;

    const poll = async () => {
      try {
        const afterId = refinementCommentId ?? undefined;
        const status = await fetchIssueStatus(GITHUB_REPO, published.number, afterId);
        setIssueStatus(status);
      } catch {
        // silent fail — will retry on next interval
      }
    };

    poll();
    pollingRef.current = setInterval(poll, 10000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [step, published, refinementCommentId]);

  const resetToStart = () => {
    setStep('choice');
    setMode(null);
    setIdea('');
    setIssues([]);
    setIssueSearch('');
    setSelectedIssue(null);
    setRefinementIdea('');
    setEditedTitle('');
    setEditedBody('');
    setPublished(null);
    setRefinementCommentId(null);
    setIssueStatus(null);
    setError(null);
  };

  const currentSteps = getSteps(mode);
  const currentIndex = stepIndex(step, mode);

  const filteredIssues = issues.filter(
    (issue) =>
      issue.title.toLowerCase().includes(issueSearch.toLowerCase()) ||
      String(issue.number).includes(issueSearch)
  );

  return (
    <div className="creator">
      <h1>Creator</h1>
      <p className="creator__subtitle">
        Generate, review, and publish new AI app feature requests.
      </p>

      <div className="creator__steps">
        {currentSteps.map((s, i) => (
          <div
            key={s}
            className={[
              'creator__step-indicator',
              step === s ? 'active' : '',
              currentIndex > i ? 'done' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <span className="creator__step-number">{i + 1}</span>
            <span className="creator__step-label">{STEP_LABELS[s]}</span>
          </div>
        ))}
      </div>

      {error && <div className="creator__error">{error}</div>}

      {step === 'choice' && (
        <div className="creator__panel">
          <h2>What would you like to do?</h2>
          <p className="creator__choice-subtitle">
            Submit a brand-new idea or add a refinement to an existing one.
          </p>
          <div className="creator__choice-grid">
            <button
              className="creator__choice-card"
              onClick={() => { setMode('new'); setStep('input'); }}
            >
              <span className="creator__choice-icon">✦</span>
              <span className="creator__choice-title">Create New Idea</span>
              <span className="creator__choice-desc">
                Start from scratch and generate a structured feature request.
              </span>
            </button>
            <button
              className="creator__choice-card"
              onClick={() => { setMode('existing'); setStep('select'); }}
            >
              <span className="creator__choice-icon">◎</span>
              <span className="creator__choice-title">Refine Existing Idea</span>
              <span className="creator__choice-desc">
                Add a comment or refinement to an idea that already exists.
              </span>
            </button>
          </div>
        </div>
      )}

      {step === 'select' && (
        <div className="creator__panel">
          <h2>Select an Existing Idea</h2>
          <div className="creator__field">
            <input
              className="creator__input"
              placeholder="Search by title or number..."
              value={issueSearch}
              onChange={(e) => setIssueSearch(e.target.value)}
            />
          </div>
          {isLoadingIssues ? (
            <p className="creator__loading">Loading ideas...</p>
          ) : filteredIssues.length === 0 ? (
            <p className="creator__empty">No open ideas found.</p>
          ) : (
            <div className="creator__issue-list">
              {filteredIssues.map((issue) => (
                <button
                  key={issue.number}
                  className={[
                    'creator__issue-item',
                    selectedIssue?.number === issue.number
                      ? 'creator__issue-item--selected'
                      : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => setSelectedIssue(issue)}
                >
                  <span className="creator__issue-number">#{issue.number}</span>
                  <span className="creator__issue-title">{issue.title}</span>
                </button>
              ))}
            </div>
          )}
          {selectedIssue && (
            <div className="creator__field">
              <label className="creator__label">Describe your refinement</label>
              <textarea
                className="creator__textarea"
                value={refinementIdea}
                onChange={(e) => setRefinementIdea(e.target.value)}
                placeholder="What would you like to add or refine in this idea?"
                rows={5}
              />
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              buttonStyle="ghost"
              onClick={() => { setMode(null); setStep('choice'); }}
            >
              Back
            </Button>
            {selectedIssue && (
              <Button
                type="button"
                buttonStyle="filled"
                isLoading={isGeneratingRef}
                disabled={refinementIdea.trim() === ''}
                onClick={() => generateRef()}
              >
                Generate Refinement
              </Button>
            )}
          </div>
        </div>
      )}

      {step === 'input' && (
        <div className="creator__panel">
          <h2>Describe your app idea</h2>
          <textarea
            className="creator__textarea"
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="Describe the app or feature you'd like to build. Be as detailed as possible..."
            rows={10}
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              buttonStyle="ghost"
              onClick={() => { setMode(null); setStep('choice'); }}
            >
              Back
            </Button>
            <Button
              type="button"
              buttonStyle="filled"
              isLoading={isGenerating}
              disabled={idea.trim() === ''}
              onClick={() => generate(idea)}
            >
              Analyze &amp; Generate
            </Button>
          </div>
        </div>
      )}

      {step === 'review' && (
        <div className="creator__panel">
          <h2>Review &amp; Edit</h2>
          {mode === 'existing' && selectedIssue && (
            <div className="creator__selected-issue">
              <span className="creator__tracker-label">Adding refinement to:</span>
              <a
                href={selectedIssue.url}
                target="_blank"
                rel="noopener noreferrer"
                className="creator__link"
              >
                #{selectedIssue.number} {selectedIssue.title}
              </a>
            </div>
          )}
          {mode === 'new' && (
            <div className="creator__field">
              <label className="creator__label">Idea Title</label>
              <input
                className="creator__input"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                placeholder="Idea title..."
              />
            </div>
          )}
          <div className="creator__field">
            <label className="creator__label">
              {mode === 'existing' ? 'Comment (Markdown)' : 'Idea Description (Markdown)'}
            </label>
            <textarea
              className="creator__textarea"
              value={editedBody}
              onChange={(e) => setEditedBody(e.target.value)}
              rows={18}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              buttonStyle="ghost"
              onClick={() => setStep(mode === 'existing' ? 'select' : 'input')}
            >
              Back
            </Button>
            <Button
              type="button"
              buttonStyle="filled"
              isLoading={mode === 'existing' ? isSubmittingComment : isPublishing}
              disabled={
                mode === 'new'
                  ? editedTitle.trim() === '' || editedBody.trim() === ''
                  : editedBody.trim() === ''
              }
              onClick={() => (mode === 'existing' ? submitComment() : publish())}
            >
              {mode === 'existing' ? 'Submit Comment' : 'Submit Idea'}
            </Button>
          </div>
        </div>
      )}

      {step === 'tracking' && published && (
        <div className="creator__panel">
          <h2>Status Tracker</h2>
          <div className="creator__tracker">
            <div className="creator__tracker-issue">
              <span className="creator__tracker-label">Idea</span>
              <a
                href={
                  mode === 'existing' && selectedIssue
                    ? selectedIssue.url
                    : published.url
                }
                target="_blank"
                rel="noopener noreferrer"
                className="creator__link"
              >
                #{published.number}
              </a>
              {issueStatus ? (
                <span className={`creator__badge creator__badge--${issueStatus.state}`}>
                  {issueStatus.state}
                </span>
              ) : (
                <span className="creator__badge creator__badge--loading">
                  Loading...
                </span>
              )}
            </div>

            {mode === 'existing' && (
              <div className="creator__comment-success">
                <span>✓ Comment posted</span>
                <a
                  href={published.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="creator__link"
                >
                  View comment
                </a>
              </div>
            )}

            {issueStatus && (
              <AgentStatusRow agentStatus={issueStatus.agentStatus} />
            )}

            {issueStatus && issueStatus.linkedPRs.length > 0 && (
              <div className="creator__tracker-prs">
                <h3>Linked Pull Requests</h3>
                {issueStatus.linkedPRs.map((pr) => (
                  <div key={pr.number} className="creator__pr-item">
                    <a
                      href={pr.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="creator__link"
                    >
                      #{pr.number} {pr.title}
                    </a>
                    <span className={`creator__badge creator__badge--${pr.state}`}>
                      {pr.state}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <p className="creator__tracker-note">Auto-refreshing every 10 seconds.</p>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" buttonStyle="ghost" onClick={resetToStart}>
              {mode === 'existing' ? 'Add Another Refinement' : 'Create Another'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
