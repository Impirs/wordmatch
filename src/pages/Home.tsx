import { useNavigate } from 'react-router-dom';
import { getAssetPath } from '../utils';

export function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-text flex flex-col items-center justify-center">
      <img src={getAssetPath('/logo.svg')} alt="WordMatch" className="h-24 w-24 md:h-32 md:w-32" />
      <h1 className="text-4xl md:text-6xl font-bold text-accent">WordMatch</h1>
      <p className="text-text-secondary md:text-lg mb-12">Учи сербский играючи</p>

      <div className="w-full max-w-xs md:max-w-sm space-y-4 md:space-y-5">
        <button
          onClick={() => { void navigate('/quiz'); }}
          className="w-full py-4 md:py-5 bg-accent text-white rounded-lg md:rounded-xl font-bold text-lg md:text-xl hover:bg-accent/80 transition-colors shadow-lg"
        >
          Играть
        </button>

        <button
          onClick={() => { void navigate('/dictionary'); }}
          className="w-full py-4 md:py-5 bg-primary text-text rounded-lg md:rounded-xl font-medium md:text-lg hover:bg-hover transition-colors"
        >
          Словарь
        </button>

        <button
          onClick={() => { void navigate('/settings'); }}
          className="w-full py-4 md:py-5 bg-primary text-text rounded-lg md:rounded-xl font-medium md:text-lg hover:bg-hover transition-colors"
        >
          Настройки
        </button>

        <button
          onClick={() => { void navigate('/info'); }}
          className="w-full py-4 md:py-5 bg-primary text-text rounded-lg md:rounded-xl font-medium md:text-lg hover:bg-hover transition-colors"
        >
          О проекте
        </button>
      </div>
    </div>
  );
}
