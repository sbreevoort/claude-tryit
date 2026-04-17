import { useMutation } from '@tanstack/react-query';
import type { AppComponentProps } from '../../Applications';
import { Button } from '../../libs/shared/components';
import { pingClaude } from '../../libs/shared/utils/anthropicApi';
import './aitester.css';

export const AITesterApp = (_props: AppComponentProps) => {
  const { mutate, isPending, data, error } = useMutation({
    mutationFn: pingClaude,
  });

  return (
    <div className="aitester">
      <h1>AI Connection Tester</h1>
      
      {/* Wrapper toegevoegd om de knop links uit te lijnen en rekken te voorkomen */}
      <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: "1rem" }}>
        <Button
          type="button"
          buttonStyle="filled"
          isLoading={isPending}
          onClick={() => mutate()}
        >
          Ping Claude
        </Button>
      </div>

      {data && (
        <p className="aitester-response">{data}</p>
      )}
      {error && (
        <p className="aitester-error">Error: {error.message}</p>
      )}
    </div>
  );
};