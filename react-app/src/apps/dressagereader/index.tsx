import { useState } from 'react';
import type { AppComponentProps } from '../../Applications';
import { Button } from '../../libs/shared/components';
import './DressageReader.css';

interface DressageTest {
  id: string;
  title: string;
  steps: string[];
}

const DRESSAGE_TESTS: DressageTest[] = [{
        "id": "B20",
        "title": "Proef B20",
        "steps": ["A-X-C: Binnenkomen in arbeidsdraf", "C: Linkerhand", "H-K: Gebroken lijn 5 meter", "F-X-H: Van hand veranderen en enkele passen de draf verruimen", "M-F: Gebroken lijn 5 meter", "E-B-E: Grote volte en na enkele drafpassen het paard de hals laten strekken", "Tussen E en H: Teugels op maat maken", "B-E-B: Grote volte", "Op de volte tussen E en B: Arbeidsgalop rechts aanspringen", "A-X-A: Grote volte", "Tussen A en K: Overgang arbeidsdraf", "E-M: Van hand veranderen", "C-X-C: Grote volte", "Op de volte tussen X en C: Arbeidsgalop links aanspringen", "E-B-E: Grote volte", "Tussen E en K: Overgang arbeidsdraf", "Tussen A en F: Overgang arbeidsstap", "F-B: Arbeidsstap", "B: Afwenden", "E: Rechterhand", "Tussen E en H: Overgang arbeidsdraf", "M-X-K: Van hand veranderen en enkele passen de draf verruimen", "A: Afwenden", "Tussen D-X: Overgang arbeidsstap", "Tussen X-G: Halthouden en groeten", "In stap de rijbaan verlaten"]
    }, {
        "id": "B21",
        "title": "Proef B21",
        "steps": ["A-X-C: Binnenkomen in arbeidsdraf", "C: Rechterhand", "M-X-K: Van hand veranderen en enkele passen de draf verruimen", "Tussen A en F: Overgang arbeidsstap", "F-E: Van hand veranderen en enkele passen de stap verruimen", "Tussen E en H: Overgang arbeidsdraf", "C-X-C: Grote volte", "Op de volte tussen X en C: Arbeidsgalop rechts aanspringen", "B-E-B: Grote volte", "Tussen F en A: Overgang arbeidsdraf", "K-B: Van hand veranderen", "C-X-C: Grote volte", "Op de volte tussen X en C: Arbeidsgalop links aanspringen", "E-B-E: Grote volte", "Tussen K en A: Overgang arbeidsdraf", "B-E-B: Grote volte en na enkele drafpassen het paard de hals laten strekken", "Tussen B en M: Teugels op maat maken", "C: Afwenden", "A: Rechterhand", "K-X-M: Van hand veranderen en enkele passen de draf verruimen", "E: Afwenden", "B: Rechterhand", "A: Afwenden", "Tussen D en X: Overgang arbeidsstap", "Tussen X en G: Halthouden en groeten", "In stap de rijbaan verlaten"]
    }
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
  const [isFinished, setIsFinished] = useState(false);

  const handleSelectTest = (test: DressageTest) => {
    setSelectedTest(test);
    setCurrentStepIndex(0);
    setIsFinished(false);
  };

  const handleVoorlezen = () => {
    if (!selectedTest) return;
    speakStep(selectedTest.steps[currentStepIndex]);
    if (currentStepIndex < selectedTest.steps.length - 1) {
      setCurrentStepIndex((i) => i + 1);
    } else {
      setIsFinished(true);
    }
  };

  const handleVorigeStap = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((i) => i - 1);
    }
  };

  const handleReset = () => {
    setCurrentStepIndex(0);
    setIsFinished(false);
  };

  const handleBack = () => {
    window.speechSynthesis.cancel();
    setSelectedTest(null);
    setCurrentStepIndex(0);
    setIsFinished(false);
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
          onClick={handleVoorlezen}
          disabled={isFinished}
        >
          Voorlezen stap
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
