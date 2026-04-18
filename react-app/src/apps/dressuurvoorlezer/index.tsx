import { useState } from 'react';
import type { AppComponentProps } from '../../Applications';
import { Button } from '../../libs/shared/components';

const steps = [
  'A – Binnenkomst in werkdraf. X – Halt, groet.',
  'X – Vertrek in werkdraf.',
  'C – Rechtsom.',
  'B – Volte rechts 20 m.',
  'F – Lichte aanzegging naar werktred.',
  'A – Werktred.',
  'K – Werkdraf.',
  'E – Volte links 20 m.',
  'H – Lichte aanzegging naar werktred.',
  'C – Werktred.',
  'M – Werkdraf.',
  'X – Halt, groet. Verlaat de baan in looppas via A.',
];

export const DressuurVoorlezerApp = (_props: AppComponentProps) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const handleReadStep = () => {
    const utterance = new SpeechSynthesisUtterance(steps[currentStepIndex]);
    utterance.lang = 'nl-NL';
    speechSynthesis.speak(utterance);

    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((i) => i + 1);
    } else {
      setIsFinished(true);
    }
  };

  const handleReset = () => {
    speechSynthesis.cancel();
    setCurrentStepIndex(0);
    setIsFinished(false);
  };

  return (
    <div>
      <h1>Dressuur Voorlezer</h1>
      <p>
        Stap {currentStepIndex + 1} van {steps.length}
        {isFinished && ' – Proef afgerond'}
      </p>
      <p>
        <strong>{steps[currentStepIndex]}</strong>
      </p>
      <Button
        type="button"
        buttonStyle="filled"
        onClick={handleReadStep}
        disabled={isFinished}
      >
        Voorlezen stap
      </Button>
      <Button
        type="button"
        buttonStyle="ghost"
        onClick={handleReset}
      >
        Opnieuw beginnen
      </Button>
    </div>
  );
};
