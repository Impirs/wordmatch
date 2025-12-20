import { useNavigate } from 'react-router-dom';
import { Header } from '../components';

export function Info() {
  const navigate = useNavigate();
  const githubUsername = "Impirs";
  const avatarUrl = `https://github.com/${githubUsername}.png`;

  return (
    <div className="min-h-screen bg-background text-text flex flex-col">
      <Header />

      <div className="flex px-4 py-4 justify-between items-center flex-row w-full">
        <button
          onClick={() => navigate('/')}
          className="text-accent bg-secondary hover:bg-hover rounded-lg
                    transition-colors flex items-center justify-center"
        >
          <img src="/icons/undo.svg" alt="go_back" className="h-12 w-12" />
        </button>
        <h1 className="text-3xl font-bold text-center flex-1">О проекте</h1>
        <div className="h-12 w-12"></div>
      </div>

      <div className="flex-1 flex flex-col items-center px-6 pb-6">
        <a 
          href={`https://github.com/${githubUsername}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-6 group"
        >
          <img
            src={avatarUrl}
            alt="GitHub Avatar"
            className="w-28 h-28 rounded-full border-4 border-accent shadow-lg group-hover:border-accent/70 transition-colors"
          />
        </a>

        <div className="max-w-md space-y-4 text-text-secondary leading-relaxed text-center">
          <p>
            Привет! Я создал этот сайт, чтобы самому тренировать сербские слова до автоматизма. 
            Когда переезжаешь в новую страну, важно быстро освоить базовую лексику, 
            и я решил сделать инструмент, который поможет в этом.
          </p>

          <p>
            Надеюсь, что WordMatch поможет и тебе! Учить слова через игру намного эффективнее, 
            чем просто читать словарь.
          </p>

          <p>
            Буду рад, если ты оценишь приложение и расскажешь, какие улучшения хотел бы видеть. 
            Твой отзыв очень важен для развития проекта!
          </p>
        </div>

        <a
          href="#" // TODO: Добавить ссылку на форму отзыва
          className="mt-8 px-6 py-3 bg-accent text-white rounded-lg font-medium hover:bg-accent/80 transition-colors shadow-lg flex items-center gap-2"
        >
          <img src="/icons/heart.svg" alt="" className="h-5 w-5" />
          Оставить отзыв
        </a>

        <a
          href={`https://github.com/${githubUsername}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 text-accent hover:text-accent/80 transition-colors flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
          GitHub
        </a>
      </div>
    </div>
  );
}
