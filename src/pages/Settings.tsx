import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components';
import { allWordSets } from '../words';
import { getAssetPath } from '../utils';

const STORAGE_KEY = 'wordmatch_enabled_sets';

export function Settings() {
  const navigate = useNavigate();
  const [enabledSets, setEnabledSets] = useState<string[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved) as string[];
    }
    // По умолчанию включен только базовый набор
    return ['basic'];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(enabledSets));
  }, [enabledSets]);

  const toggleSet = (setId: string) => {
    setEnabledSets(prev => {
      const newSets = prev.includes(setId)
        ? prev.filter(id => id !== setId)
        : [...prev, setId];
      return newSets;
    });
  };

  return (
    <div className="min-h-screen bg-background text-text">
      <Header />

      <div className="flex px-4 py-4 justify-between items-center flex-row w-full">
        <button
          onClick={() => { void navigate('/'); }}
          className="text-accent bg-secondary hover:bg-hover rounded-lg
                    transition-colors flex items-center justify-center"
        >
          <img src={getAssetPath('/icons/undo.svg')} alt="go_back" className="h-12 w-12" />
        </button>
        <h1 className="text-3xl font-bold text-center flex-1">Настройки</h1>
        <div className="h-12 w-12"></div>
      </div>

      <div className="max-w-md md:max-w-xl mx-auto px-4 md:px-6">
        <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6 text-text-secondary">Наборы слов</h2>

        <div className="space-y-3 md:space-y-4">
          {allWordSets.map(set => (
            <div
              key={set.id}
              onClick={() => toggleSet(set.id)}
              className={`p-4 md:p-5 rounded-lg md:rounded-xl cursor-pointer transition-all ${
                enabledSets.includes(set.id)
                  ? 'bg-accent/20 border-2 border-accent'
                  : 'bg-primary border-2 border-transparent hover:border-accent/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium md:text-lg">{set.name}</h3>
                  <p className="text-sm md:text-base text-text-secondary">{set.description}</p>
                  <p className="text-xs md:text-sm text-text-secondary mt-1">{set.words.length} слов</p>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  enabledSets.includes(set.id)
                    ? 'bg-accent border-accent'
                    : 'border-text-secondary'
                }`}>
                  {enabledSets.includes(set.id) && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {enabledSets.length === 0 && (
          <p className="mt-4 text-error text-sm">
            Выберите хотя бы один набор слов для игры
          </p>
        )}
      </div>
    </div>
  );
}
