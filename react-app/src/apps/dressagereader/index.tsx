import { useState } from 'react';
import type { AppComponentProps } from '../../Applications';
import { Button } from '../../libs/shared/components';
import './DressageReader.css';

interface DressageTest {
  id: string;
  title: string;
  steps: string[];
}

const DRESSAGE_TESTS: DressageTest[] = [
  {
    id: 'B20',
    title: 'B20',
    steps: [
      'A-X Binnenkomen in arbeidsdraf',
      'X halthouden en groeten',
      'C Rechterhand',
      'E Linkerhand',
      'B Rechtsom volte 10 meter',
      'A Linksom aanhouden en doorlopen',
      'E Linkerhand',
      'B Rechtsom volte 10 meter',
      'A Linksom aanhouden en doorlopen',
      'X Halt, groeten en verlaten',
    ],
  },
  {
    id: 'B21',
    title: 'B21',
    steps: [
      'A Binnenkomen in arbeidsdraf',
      'X halthouden en groeten',
      'C Linkerhand',
      'E Rechterhand',
      'B Linksom volte 10 meter',
      'A Rechtsom aanhouden en doorlopen',
      'E Rechterhand',
      'B Linksom volte 10 meter',
      'A Rechtsom aanhouden en doorlopen',
      'X Halt, groeten en verlaten',
    ],
  },
];

const speakStep = (text: string) => {
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  const voices = window.speechSynthesis.getVoices();
  const dutchVoice = voices.find((v) => v.lang === 'nl-NL');
  if (dutchVoice) utterance.voice = dutchVoice;
  utterance.lang = 'nl-NL';
  window.speechSynthesis.speak(utterance);
};

export const DressageReaderApp = (_props: AppComponentProps) => {
  const [selectedTest, setSelectedTest] = useState<DressageTest | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const handleSelectTest = (test: DressageTest) => {
    setSelectedTest(test);
    setCurrentStepIndex(0);
  };

  const handleVolgendeStap = () => {
    if (!selectedTest) return;
    speakStep(selectedTest.steps[currentStepIndex]);
    if (currentStepIndex < selectedTest.steps.length - 1) {
      setCurrentStepIndex((i) => i + 1);
    }
  };

  const handleVorigeStap = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((i) => i - 1);
    }
  };

  const handleReset = () => {
    setCurrentStepIndex(0);
  };

  const handleBack = () => {
    window.speechSynthesis.cancel();
    setSelectedTest(null);
    setCurrentStepIndex(0);
  };

  if (!selectedTest) {
    return (
      <div className="dressage-reader">
        <h1>Dressuur Voorlezer</h1>
        <p className="dressage-reader__intro">
          Kies een dressuurproef om te starten. De app leest elke stap voor in het Nederlands.
        </p>
        <div className="dressage-reader__test-selection">
          {DRESSAGE_TESTS.map((test) => (
            <Button
              key={test.id}
              type="button"
              buttonStyle="filled"
              className="dressage-reader__test-btn"
              onClick={() => handleSelectTest(test)}
            >
              {test.title}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  const isLastStep = currentStepIndex === selectedTest.steps.length - 1;

  return (
    <div className="dressage-reader">
      <div className="dressage-reader__header">
        <h1>Dressuurproef {selectedTest.title}</h1>
        <Button type="button" buttonStyle="ghost" onClick={handleBack}>
          ← Terug
        </Button>
      </div>

      <ol className="dressage-reader__steps">
        {selectedTest.steps.map((step, index) => (
          <li
            key={index}
            className={`dressage-reader__step${index === currentStepIndex ? ' dressage-reader__step--active' : ''}`}
          >
            {step}
          </li>
        ))}
      </ol>

      <div className="dressage-reader__controls">
        <Button
          type="button"
          buttonStyle="filled"
          className="dressage-reader__volgende-btn"
          onClick={handleVolgendeStap}
          disabled={isLastStep}
        >
          Volgende Stap
        </Button>
        <div className="dressage-reader__secondary-controls">
          <Button
            type="button"
            buttonStyle="ghost"
            onClick={handleVorigeStap}
            disabled={currentStepIndex === 0}
          >
            ← Vorige Stap
          </Button>
          <Button type="button" buttonStyle="ghost" onClick={handleReset}>
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
};
