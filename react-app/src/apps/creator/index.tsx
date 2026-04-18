import { useState, useEffect, useRef, type ReactNode } from 'react';
import { useMutation } from '@tanstack/react-query';
import type { AppComponentProps } from '../../Applications';
import { Button } from '../../libs/shared/components';
import {
  createIssue,
  fetchIssueStatus,
} from '../../libs/shared/utils/githubService';
import type { AgentStatus, CreatedIssue, IssueStatus } from '../../libs/shared/utils/githubService';
import './Creator.css';

const GITHUB_REPO = 'sbreevoort/claude-tryit';

interface GeneratedIssue {
  title: string;
  body: string;
}

type Step = 'input' | 'review' | 'tracking';

const STEP_LABELS: Record<Step, string> = {
  input: 'Idea Input',
  review: 'Review & Edit',
  tracking: 'Status Tracker',
};

const STEPS: Step[] = ['input', 'review', 'tracking'];

function stepIndex(step: Step): number {
  return STEPS.indexOf(step);
}

const generateIssue = async (idea: string): Promise<GeneratedIssue> => {
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
            `Transform the following app idea into a structured GitHub issue. ` +
            `Return ONLY a valid JSON object with exactly two keys: ` +
            `"title" (concise issue title, no markdown) and ` +
            `"body" (complete GitHub issue body in Markdown with sections: ` +
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
  return JSON.parse(jsonString) as GeneratedIssue;
};

const AGENT_STATUS_CONFIG: Record<AgentStatus, { label: string; icon: ReactNode }> = {
  pending: { label: 'Wacht op Claude...', icon: '⏳' },
  in_progress: { label: 'Claude is aan het bouwen...', icon: <span className="creator__spinner" /> },
  review: { label: 'Code gepusht (Klaar voor review)', icon: '✓' },
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
  const [step, setStep] = useState<Step>('input');
  const [idea, setIdea] = useState('');
  const [editedTitle, setEditedTitle] = useState('');
  const [editedBody, setEditedBody] = useState('');
  const [published, setPublished] = useState<CreatedIssue | null>(null);
  const [issueStatus, setIssueStatus] = useState<IssueStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { mutate: generate, isPending: isGenerating } = useMutation({
    mutationFn: generateIssue,
    onSuccess: (data) => {
      setEditedTitle(data.title);
      setEditedBody(data.body);
      setStep('review');
      setError(null);
    },
    onError: (err: Error) => {
      setError(`Failed to generate issue: ${err.message}`);
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
      setError(`Failed to publish issue: ${err.message}`);
    },
  });

  useEffect(() => {
    if (step !== 'tracking' || !published) return;

    const poll = async () => {
      try {
        const status = await fetchIssueStatus(GITHUB_REPO, published.number);
        setIssueStatus(status);
      } catch {
        // silent fail — will retry on next interval
      }
    };

    poll();
    pollingRef.current = setInterval(poll, 30000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [step, published]);

  const resetToStart = () => {
    setStep('input');
    setIdea('');
    setEditedTitle('');
    setEditedBody('');
    setPublished(null);
    setIssueStatus(null);
    setError(null);
  };

  const currentIndex = stepIndex(step);

  return (
    <div className="creator">
      <h1>Creator</h1>
      <p className="creator__subtitle">
        Generate, review, and publish new AI app feature requests to GitHub.
      </p>

      <div className="creator__steps">
        {STEPS.map((s, i) => (
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
          <div className="creator__field">
            <label className="creator__label">Issue Title</label>
            <input
              className="creator__input"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              placeholder="Issue title..."
            />
          </div>
          <div className="creator__field">
            <label className="creator__label">Issue Body (Markdown)</label>
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
              onClick={() => setStep('input')}
            >
              Back
            </Button>
            <Button
              type="button"
              buttonStyle="filled"
              isLoading={isPublishing}
              disabled={editedTitle.trim() === '' || editedBody.trim() === ''}
              onClick={() => publish()}
            >
              Publish to GitHub
            </Button>
          </div>
        </div>
      )}

      {step === 'tracking' && published && (
        <div className="creator__panel">
          <h2>Status Tracker</h2>
          <div className="creator__tracker">
            <div className="creator__tracker-issue">
              <span className="creator__tracker-label">Issue</span>
              <a
                href={published.url}
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

            <p className="creator__tracker-note">Auto-refreshing every 30 seconds.</p>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" buttonStyle="ghost" onClick={resetToStart}>
              Create Another
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
