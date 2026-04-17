import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import type { AppComponentProps } from '../../Applications';
import { Button } from '../../libs/shared/components';
import { generatePitch } from '../../libs/shared/utils/pitchApi';
import './Pitch.css';

export const CandidatePitchApp = (_props: AppComponentProps) => {
  const [notes, setNotes] = useState('');

  const { mutate, isPending, data, error } = useMutation({
    mutationFn: generatePitch,
  });

  return (
    <div className="pitch-generator">
      <h1>Candidate Pitch Generator</h1>
      <p>
        Paste your rough notes or CV snippets below. AI will automatically detect
        the language (Dutch/English) and turn them into a professional client
        pitch in the same language.
      </p>

      <textarea
        className="pitch-generator__textarea"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Paste candidate notes or CV snippets here..."
      />

      <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
        <Button
          type="button"
          buttonStyle="filled"
          isLoading={isPending}
          disabled={notes.trim() === ''}
          onClick={() => mutate(notes)}
        >
          Generate Pitch
        </Button>
      </div>

      {data && (
        <div className="pitch-generator__results">
          <h2>Results</h2>
          <div>
            <span className="pitch-generator__badge">{data.coreStrength}</span>
          </div>
          <p className="pitch-generator__pitch">{data.pitch}</p>
        </div>
      )}

      {error && (
        <p className="pitch-generator__error">Error: {error.message}</p>
      )}
    </div>
  );
};
