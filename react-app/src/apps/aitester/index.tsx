import { useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import type { AppComponentProps } from '../../Applications';
import { Button } from '../../libs/shared/components';
import { pingClaude } from '../../libs/shared/utils/anthropicApi';
import './aitester.css';

const STATUS_URL = 'https://status.claude.com/';

const ClaudeStatusSection = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [embedBlocked, setEmbedBlocked] = useState(false);

  const handleIframeLoad = () => {
    setIsLoading(false);
    try {
      // Cross-origin iframe throws SecurityError = content is displaying successfully
      // Receiving about:blank = blocked by X-Frame-Options or CSP
      const href = iframeRef.current?.contentWindow?.location?.href;
      setEmbedBlocked(href === 'about:blank' || href === '' || href == null);
    } catch {
      // SecurityError = cross-origin = iframe is showing external content
      setEmbedBlocked(false);
    }
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setEmbedBlocked(true);
  };

  return (
    <div className="aitester-status">
      <h2 className="aitester-status-title">Claude System Status</h2>

      {!embedBlocked && (
        <div className="aitester-status-iframe-container">
          {isLoading && (
            <div className="aitester-status-loading">
              <span>Loading status page…</span>
            </div>
          )}
          <iframe
            ref={iframeRef}
            src={STATUS_URL}
            title="Claude System Status"
            className={`aitester-status-iframe${isLoading ? ' aitester-status-iframe--hidden' : ''}`}
            onLoad={handleIframeLoad}
            onError={handleIframeError}
          />
        </div>
      )}

      {embedBlocked && (
        <div className="aitester-status-fallback">
          <p>The Claude status page cannot be embedded directly due to browser security policies.</p>
          <a
            href={STATUS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="aitester-status-link"
          >
            View Claude Status Page →
          </a>
        </div>
      )}

      {!embedBlocked && (
        <div className="aitester-status-direct-link">
          <a href={STATUS_URL} target="_blank" rel="noopener noreferrer">
            Open full status page ↗
          </a>
        </div>
      )}
    </div>
  );
};

export const AITesterApp = (_props: AppComponentProps) => {
  const { mutate, isPending, data, error } = useMutation({
    mutationFn: pingClaude,
  });

  return (
    <div className="aitester">
      <div className="aitester-ping">
        <h1>AI Connection Tester</h1>

        <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '1rem' }}>
          <Button
            type="button"
            buttonStyle="filled"
            isLoading={isPending}
            onClick={() => mutate()}
          >
            Ping Claude
          </Button>
        </div>

        {data && <p className="aitester-response">{data}</p>}
        {error && <p className="aitester-error">Error: {error.message}</p>}
      </div>

      <hr className="aitester-divider" />

      <ClaudeStatusSection />
    </div>
  );
};
