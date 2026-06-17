import React, { useState } from 'react';
import { TutorialData } from '../games/tutorial';
import { AudioManager } from '../games/audio';

interface TutorialProps {
  tutorial: TutorialData;
  onComplete: () => void;
  onSkip: () => void;
}

const Tutorial: React.FC<TutorialProps> = ({ tutorial, onComplete, onSkip }) => {
  const [step, setStep] = useState(0);

  const current = tutorial.steps[step];
  const isLast = step === tutorial.steps.length - 1;

  const handleNext = () => {
    AudioManager.playClick();
    if (isLast) {
      onComplete();
    } else {
      setStep(step + 1);
    }
  };

  const handleSkip = () => {
    AudioManager.playClick();
    onSkip();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div
        className="rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl animate-pop-in"
        style={{
          background: 'var(--card-bg)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-color, #333)',
        }}
      >
        <div className="text-center mb-4">
          <span className="text-4xl">📚</span>
          <h2 className="text-xl font-bold mt-2">{tutorial.title}</h2>
        </div>

        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-1">{current.title}</h3>
          <p className="text-sm opacity-75">{current.description}</p>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-1">
            {tutorial.steps.map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full transition-all"
                style={{
                  background: i <= step ? 'var(--btn-primary)' : 'var(--border-color, #555)',
                }}
              />
            ))}
          </div>
          <span className="text-xs opacity-50">
            {step + 1}/{tutorial.steps.length}
          </span>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleSkip}
            className="flex-1 py-2 rounded-xl font-semibold transition text-sm"
            style={{
              background: 'var(--cell-bg)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color, #555)',
            }}
          >
            Skip
          </button>
          <button
            onClick={handleNext}
            className="flex-1 py-2 rounded-xl font-semibold text-white transition hover:opacity-90 text-sm"
            style={{ background: 'var(--btn-primary)' }}
          >
            {isLast ? 'Start Playing' : current.action}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Tutorial;
