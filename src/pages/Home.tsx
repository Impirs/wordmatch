import { useNavigate } from 'react-router-dom';

export function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-text flex flex-col items-center justify-center p-6">
      <img src="/logo.png" alt="WordMatch" className="h-24 w-24 mb-4" />
      <h1 className="text-4xl font-bold mb-2 text-accent">WordMatch</h1>
      <p className="text-text-secondary mb-12">Учи сербский играючи</p>

      <div className="w-full max-w-xs space-y-4">
        <button
          onClick={() => navigate('/quiz')}
          className="w-full py-4 bg-accent text-white rounded-lg font-bold text-lg hover:bg-accent/80 transition-colors shadow-lg"
        >
          Играть
        </button>

        <button
          onClick={() => navigate('/dictionary')}
          className="w-full py-4 bg-primary text-text rounded-lg font-medium hover:bg-hover transition-colors"
        >
          Словарь
        </button>

        <button
          onClick={() => navigate('/settings')}
          className="w-full py-4 bg-primary text-text rounded-lg font-medium hover:bg-hover transition-colors"
        >
          Настройки
        </button>

        <button
          onClick={() => navigate('/info')}
          className="w-full py-4 bg-primary text-text rounded-lg font-medium hover:bg-hover transition-colors"
        >
          О проекте
        </button>
      </div>
    </div>
  );
}
