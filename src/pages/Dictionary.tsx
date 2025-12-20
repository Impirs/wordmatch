import { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components';
import { getAllUniqueWords } from '../words';

type Direction = 'serbian-russian' | 'russian-serbian';

export function Dictionary() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [direction, setDirection] = useState<Direction>('serbian-russian');
  const listRef = useRef<HTMLDivElement>(null);

  const allWords = useMemo(() => getAllUniqueWords(), []);

  // Получаем слова в зависимости от направления
  const words = useMemo(() => {
    return allWords.map(([serbian, russian]) => 
      direction === 'serbian-russian' 
        ? { word: serbian, translation: russian }
        : { word: russian, translation: serbian }
    );
  }, [allWords, direction]);

  // Фильтрация по поиску
  const filteredWords = useMemo(() => {
    if (!searchQuery.trim()) return words;
    const query = searchQuery.toLowerCase();
    return words.filter(
      ({ word, translation }) =>
        word.toLowerCase().includes(query) ||
        translation.toLowerCase().includes(query)
    );
  }, [words, searchQuery]);

  // Группировка по первой букве
  const groupedWords = useMemo(() => {
    const groups: Record<string, typeof filteredWords> = {};
    
    filteredWords.forEach(item => {
      const firstLetter = item.word.charAt(0).toUpperCase();
      if (!groups[firstLetter]) {
        groups[firstLetter] = [];
      }
      groups[firstLetter].push(item);
    });

    // Сортировка внутри групп
    Object.keys(groups).forEach(letter => {
      groups[letter].sort((a, b) => a.word.localeCompare(b.word));
    });

    return groups;
  }, [filteredWords]);

  // Алфавит для навигации
  const alphabet = useMemo(() => {
    return Object.keys(groupedWords).sort((a, b) => a.localeCompare(b));
  }, [groupedWords]);

  const scrollToLetter = (letter: string) => {
    const element = document.getElementById(`letter-${letter}`);
    if (element && listRef.current) {
      const container = listRef.current;
      const elementTop = element.offsetTop - container.offsetTop;
      container.scrollTo({ top: elementTop, behavior: 'smooth' });
    }
  };

  const toggleDirection = () => {
    setDirection(prev => 
      prev === 'serbian-russian' ? 'russian-serbian' : 'serbian-russian'
    );
  };

  return (
    <div className="h-screen bg-background text-text flex flex-col overflow-hidden">
      <Header />
      
      {/* Навигация и заголовок */}
      <div className="flex px-4 py-4 justify-between items-center flex-row w-full">
        <button
          onClick={() => navigate('/')}
          className="text-accent bg-secondary hover:bg-hover rounded-lg
                    transition-colors flex items-center justify-center"
        >
          <img src="/icons/undo.svg" alt="go_back" className="h-12 w-12" />
        </button>
        <h1 className="text-3xl font-bold text-center flex-1">Словарь</h1>
        <div className="h-12 w-12"></div>
      </div>
      
      {/* Поиск и переключатель направления */}
      <div className="px-4 pb-4 flex gap-2">
        <input
          type="text"
          placeholder="Поиск..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-4 py-2 bg-primary rounded-lg border border-transparent focus:border-accent focus:outline-none"
        />
        <button
          onClick={toggleDirection}
          className="px-4 py-2 bg-primary rounded-lg hover:bg-hover transition-colors text-sm whitespace-nowrap"
          title="Переключить направление перевода"
        >
          {direction === 'serbian-russian' ? 'SR → RU' : 'RU → SR'}
        </button>
      </div>

      {/* Основной контент */}
      <div className="flex flex-1 overflow-hidden">
        {/* Алфавитная навигация - закреплена */}
        <div className="w-6 flex flex-col items-center py-2 text-xs flex-shrink-0">
          {alphabet.map(letter => (
            <button
              key={letter}
              onClick={() => scrollToLetter(letter)}
              className="py-0.5 text-accent hover:text-accent/80 transition-colors"
            >
              {letter}
            </button>
          ))}
        </div>

        {/* Список слов - прокручивается */}
        <div ref={listRef} className="flex-1 overflow-y-auto px-4 pb-4">
          {alphabet.length === 0 ? (
            <p className="text-text-secondary text-center py-8">
              Слова не найдены
            </p>
          ) : (
            alphabet.map(letter => (
              <div key={letter} id={`letter-${letter}`}>
                <h2 className="text-lg font-bold text-accent sticky top-0 bg-background py-2">
                  {letter}
                </h2>
                <div className="space-y-1">
                  {groupedWords[letter].map(({ word, translation }, index) => (
                    <div
                      key={`${word}-${index}`}
                      className="py-2 border-b border-primary/50"
                    >
                      <span className="font-medium">{word}</span>
                      <span className="text-text-secondary"> — </span>
                      <span className="text-text-secondary">{translation}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
