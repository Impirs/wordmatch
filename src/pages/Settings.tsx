import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "../components";
import { allWordSets } from "../words";
import { getAssetPath, getEnabledSetsByBlock, setEnabledSetsByBlock } from "../utils";

const blockSections = [
  {
    id: "blok-1",
    title: "Блок 1",
    sets: allWordSets.filter((set) => set.id.startsWith("blok-1-")),
  },
  {
    id: "blok-2",
    title: "Блок 2",
    sets: allWordSets.filter((set) => set.id.startsWith("blok-2-")),
  },
  {
    id: "blok-3",
    title: "Блок 3",
    sets: allWordSets.filter((set) => set.id.startsWith("blok-3-")),
  },
].filter((section) => section.sets.length > 0);

export function Settings() {
  const navigate = useNavigate();
  const [enabledSets, setEnabledSets] = useState<string[]>(() => {
    const grouped = getEnabledSetsByBlock();
    return [...grouped.Blok1, ...grouped.Blok2, ...grouped.Blok3];
  });

  useEffect(() => {
    const grouped = {
      Blok1: enabledSets.filter((id) => id.startsWith("blok-1-")),
      Blok2: enabledSets.filter((id) => id.startsWith("blok-2-")),
      Blok3: enabledSets.filter((id) => id.startsWith("blok-3-")),
    };
    setEnabledSetsByBlock(grouped);
  }, [enabledSets]);

  const toggleSet = (setId: string) => {
    setEnabledSets((prev) => {
      const newSets = prev.includes(setId)
        ? prev.filter((id) => id !== setId)
        : [...prev, setId];
      return newSets;
    });
  };

  return (
    <div className="h-screen bg-background text-text overflow-hidden flex flex-col">
      <Header />

      <div className="flex px-4 py-4 justify-between items-center flex-row w-full">
        <button
          onClick={() => {
            void navigate("/");
          }}
          className="text-accent bg-secondary hover:bg-hover rounded-lg
                    transition-colors flex items-center justify-center"
        >
          <img
            src={getAssetPath("/icons/undo.svg")}
            alt="go_back"
            className="h-12 w-12"
          />
        </button>
        <h1 className="text-3xl font-bold text-center flex-1">Настройки</h1>
        <div className="h-12 w-12"></div>
      </div>

      {enabledSets.length === 0 && (
        <p className="my-2 text-error text-sm mx-auto w-full max-w-md text-center">
          Выберите хотя бы один набор слов для игры
        </p>
      )}

      <div className="max-w-full mx-6 space-y-8 overflow-auto">
          {blockSections.map((section) => (
            <section key={section.id} className="space-y-4">
              <div className="flex items-center gap-3">
                <h2 className="text-xl md:text-2xl font-semibold text-text">
                  {section.title}
                </h2>
                <div className="h-px flex-1 bg-text-secondary/20" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {section.sets.map((set) => (
                  <div
                    key={set.id}
                    onClick={() => toggleSet(set.id)}
                    className={`p-4 md:p-5 rounded-lg md:rounded-xl cursor-pointer transition-all ${
                      enabledSets.includes(set.id)
                        ? "bg-accent/20 border-2 border-accent"
                        : "bg-primary border-2 border-transparent hover:border-accent/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium md:text-lg">{set.name}</h3>
                        <p className="text-sm md:text-base text-text-secondary">
                          {set.description}
                        </p>
                        <p className="text-xs md:text-sm text-text-secondary mt-1">
                          {set.words.length} карточек
                        </p>
                      </div>
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          enabledSets.includes(set.id)
                            ? "bg-accent border-accent"
                            : "border-text-secondary"
                        }`}
                      >
                        {enabledSets.includes(set.id) && (
                          <img src={getAssetPath("/icons/done.svg")} alt="done" className="h-6 w-6" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
      </div>
    </div>
  );
}
