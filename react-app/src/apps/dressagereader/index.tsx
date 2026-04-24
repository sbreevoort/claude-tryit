import { useState, useEffect, useRef } from 'react';
import type { AppComponentProps } from '../../Applications';
import { Button } from '../../libs/shared/components';
import './DressageReader.css';

interface DressageTest {
  id: string;
  title: string;
  steps: string[];
}

const SELF_NARRATION_VALUE = '__self__';

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

export const DressageReaderApp = (_props: AppComponentProps) => {
  const [selectedTest, setSelectedTest] = useState<DressageTest | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [isSelfNarration, setIsSelfNarration] = useState(false);
  const activeStepRef = useRef<HTMLLIElement | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices().filter(v => v.lang.includes('nl'));
      if (voices.length > 0) {
        setAvailableVoices(voices);
        setSelectedVoice(prev => {
          if (prev) return prev;
          const googleVoice = voices.find(v => v.name.toLowerCase().includes('google'));
          return googleVoice ?? voices[0];
        });
      }
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  useEffect(() => {
    activeStepRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [currentStepIndex]);

  const cancelActiveUtterance = () => {
    if (utteranceRef.current) {
      utteranceRef.current.onend = null;
      utteranceRef.current = null;
    }
    window.speechSynthesis.cancel();
  };

  const handleSelectTest = (test: DressageTest) => {
    cancelActiveUtterance();
    setSelectedTest(test);
    setCurrentStepIndex(0);
    setIsFinished(false);
  };

  const handleVoorlezen = () => {
    if (!selectedTest) return;
    cancelActiveUtterance();

    const advanceStep = () => {
      if (currentStepIndex < selectedTest.steps.length - 1) {
        setCurrentStepIndex(i => i + 1);
      } else {
        setIsFinished(true);
      }
    };

    if (!isSelfNarration) {
      const utterance = new SpeechSynthesisUtterance(selectedTest.steps[currentStepIndex]);
      if (selectedVoice) utterance.voice = selectedVoice;
      utterance.lang = 'nl-NL';
      utterance.onend = () => {
        utteranceRef.current = null;
        advanceStep();
      };
      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    } else {
      advanceStep();
    }
  };

  const handleVorigeStap = () => {
    cancelActiveUtterance();
    if (currentStepIndex > 0) setCurrentStepIndex(i => i - 1);
  };

  const handleReset = () => {
    cancelActiveUtterance();
    setCurrentStepIndex(0);
    setIsFinished(false);
  };

  const selectValue = isSelfNarration ? SELF_NARRATION_VALUE : (selectedVoice?.name ?? '');

  return (
    <div className="dressage-reader">
      <aside className="dressage-reader__panel">
        <div className="dressage-reader__panel-top">
          <h2 className="dressage-reader__panel-title">Dressuur Voorlezer</h2>
          <p className="dressage-reader__panel-subtitle">
            Kies een proef en laat de app de stappen voorlezen.
          </p>
        </div>

        <div className="dressage-reader__voice-section">
          <label className="dressage-reader__section-label" htmlFor="voice-select">
            Stem
          </label>
          <select
            id="voice-select"
            className="dressage-reader__voice-select"
            value={selectValue}
            onChange={e => {
              if (e.target.value === SELF_NARRATION_VALUE) {
                setSelectedVoice(null);
                setIsSelfNarration(true);
              } else {
                const voice = availableVoices.find(v => v.name === e.target.value) ?? null;
                setSelectedVoice(voice);
                setIsSelfNarration(false);
              }
            }}
          >
            {availableVoices.map(v => (
              <option key={v.name} value={v.name}>
                {v.name}
              </option>
            ))}
            <option value={SELF_NARRATION_VALUE}>Zelf voorlezen</option>
          </select>
        </div>

        <div className="dressage-reader__test-section">
          <span className="dressage-reader__section-label">Proeven</span>
          <nav className="dressage-reader__test-nav">
            {DRESSAGE_TESTS.map(test => (
              <button
                key={test.id}
                type="button"
                className={`dressage-reader__test-item${selectedTest?.id === test.id ? ' dressage-reader__test-item--active' : ''}`}
                onClick={() => handleSelectTest(test)}
              >
                {test.title}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      <div className="dressage-reader__content">
        {!selectedTest ? (
          <div className="dressage-reader__welcome">
            <span className="dressage-reader__welcome-icon" role="img" aria-label="paard">🐴</span>
            <h2>Selecteer een proef</h2>
            <p>Kies een dressuurproef in het menu aan de linkerzijde om te beginnen.</p>
          </div>
        ) : (
          <>
            <div className="dressage-reader__content-header">
              <h2 className="dressage-reader__test-title">{selectedTest.title}</h2>
              <span className="dressage-reader__badge">
                {isFinished ? 'Klaar!' : `Stap ${currentStepIndex + 1} / ${selectedTest.steps.length}`}
              </span>
            </div>
            <div className="dressage-reader__steps-wrap">
              <ol className="dressage-reader__steps">
                {selectedTest.steps.map((step, index) => (
                  <li
                    key={index}
                    ref={index === currentStepIndex ? activeStepRef : null}
                    className={[
                      'dressage-reader__step',
                      index === currentStepIndex && 'dressage-reader__step--active',
                      index < currentStepIndex && 'dressage-reader__step--done',
                    ].filter(Boolean).join(' ')}
                  >
                    {step}
                  </li>
                ))}
              </ol>
            </div>
            <footer className="dressage-reader__footer">
              <Button
                type="button"
                buttonStyle="ghost"
                onClick={handleVorigeStap}
                disabled={currentStepIndex === 0}
              >
                ← Vorige
              </Button>
              <Button
                type="button"
                buttonStyle="filled"
                className="dressage-reader__play-btn"
                onClick={handleVoorlezen}
                disabled={isFinished}
              >
                {isSelfNarration ? 'Volgende Stap' : '▶\u00a0\u00a0Voorlezen Stap'}
              </Button>
              <Button
                type="button"
                buttonStyle="ghost"
                onClick={handleReset}
              >
                ↺ Reset
              </Button>
            </footer>
          </>
        )}
      </div>
    </div>
  );
};
