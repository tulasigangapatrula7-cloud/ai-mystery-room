// client/src/pages/Create.jsx
// Choose a premise and difficulty, then ask the backend to generate a mystery.

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Sparkles } from "lucide-react";
import { createCase, saveCurrentCase } from "../services/api.js";
import { DIFFICULTIES, EXAMPLES, PREMISE_MAX, PREMISE_MIN } from "../constants.js";
import { ErrorBox } from "../components/UI.jsx";
import usePageTitle from "../hooks/usePageTitle.js";

const STATUS_MESSAGES = [
  "Setting the scene...",
  "Inventing suspects with secrets...",
  "Hiding clues around the room...",
  "Checking that the case is fair...",
  "Sealing the solution in an envelope...",
];

export default function Create() {
  usePageTitle("New Mystery");
  const navigate = useNavigate();

  const [premise, setPremise] = useState("");
  const [difficulty, setDifficulty] = useState("easy");
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [seconds, setSeconds] = useState(0);

  const trimmed = premise.trim();
  let validationError = "";
  if (trimmed.length < PREMISE_MIN) {
    validationError = `Please write at least ${PREMISE_MIN} characters (you have ${trimmed.length}).`;
  } else if (trimmed.length > PREMISE_MAX) {
    validationError = `Please keep it under ${PREMISE_MAX} characters.`;
  }

  // Count seconds while the mystery is being written.
  useEffect(() => {
    if (!loading) return undefined;
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [loading]);

  async function handleSubmit(event) {
    event.preventDefault();
    setTouched(true);
    if (validationError || loading) return;

    setLoading(true);
    setError(null);
    setSeconds(0);

    try {
      const created = await createCase(trimmed, difficulty);
      saveCurrentCase(created.id);
      navigate(`/case/${created.id}`);
    } catch (err) {
      setError(err);
      setLoading(false);
    }
  }

  // ----- Loading screen -----
  if (loading) {
    const message = STATUS_MESSAGES[Math.floor(seconds / 4) % STATUS_MESSAGES.length];
    return (
      <div className="glass-gold mx-auto max-w-xl px-6 py-16 text-center">
        <Loader2 className="mx-auto h-14 w-14 animate-spin text-gold-400" aria-hidden="true" />
        <h1 className="mt-6 text-3xl">Writing your mystery</h1>
        <p className="mt-3 text-gold-300" role="status">
          {message}
        </p>
        <p className="mt-6 text-sm text-slate-400">This usually takes 10 to 30 seconds.</p>
        {seconds >= 20 && (
          <p className="mt-3 text-sm text-slate-400">
            Still working. The free server can take up to a minute to wake up, so please keep this
            page open.
          </p>
        )}
      </div>
    );
  }

  // ----- Form -----
  return (
    <div className="mx-auto max-w-3xl">
      <div className="text-center">
        <p className="eyebrow">New case</p>
        <h1 className="mt-2 text-3xl sm:text-4xl">Create your mystery</h1>
        <p className="mt-3 text-slate-400">
          Describe the setting or the crime. The AI will do the rest.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="glass mt-8 space-y-8 p-5 sm:p-8" noValidate>
        {error && <ErrorBox message={error.message} />}

        {/* Premise */}
        <div>
          <label htmlFor="premise" className="mb-2 block text-sm font-semibold text-slate-200">
            Mystery premise
          </label>
          <textarea
            id="premise"
            rows={4}
            maxLength={PREMISE_MAX}
            className="field resize-y"
            placeholder="Example: A priceless painting vanishes during a charity gala at a seaside mansion"
            value={premise}
            onChange={(event) => setPremise(event.target.value)}
            onBlur={() => setTouched(true)}
            aria-invalid={touched && Boolean(validationError)}
            aria-describedby="premise-help"
          />
          <div id="premise-help" className="mt-2 flex items-start justify-between gap-3 text-xs">
            <span className={touched && validationError ? "text-red-400" : "text-slate-500"}>
              {touched && validationError ? validationError : `At least ${PREMISE_MIN} characters.`}
            </span>
            <span className="text-slate-500">
              {premise.length}/{PREMISE_MAX}
            </span>
          </div>

          <p className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Need an idea? Try one of these
          </p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => setPremise(example)}
                className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-left text-xs text-slate-300 transition hover:border-gold-400/60 hover:text-gold-300"
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty */}
        <fieldset>
          <legend className="mb-3 block text-sm font-semibold text-slate-200">Difficulty</legend>
          <div className="grid gap-3 sm:grid-cols-3">
            {DIFFICULTIES.map((level) => {
              const selected = difficulty === level.id;
              return (
                <label
                  key={level.id}
                  className={`cursor-pointer rounded-xl border p-4 transition focus-within:outline focus-within:outline-2 focus-within:outline-gold-400 ${
                    selected
                      ? "border-gold-400 bg-gold-500/10 shadow-glow"
                      : "border-white/15 bg-white/5 hover:border-gold-400/50"
                  }`}
                >
                  <input
                    type="radio"
                    name="difficulty"
                    value={level.id}
                    checked={selected}
                    onChange={() => setDifficulty(level.id)}
                    className="sr-only"
                  />
                  <span className="block font-display text-xl">{level.name}</span>
                  <span className="mt-1 block text-xs text-slate-400">
                    {level.suspects} suspects, {level.clues} clues, {level.hints} hints
                  </span>
                  <span className="mt-2 block text-xs text-gold-300">Base score {level.base}</span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <button type="submit" className="btn-gold w-full py-4 text-base">
          <Sparkles className="h-5 w-5" aria-hidden="true" />
          Generate Mystery
        </button>
      </form>
    </div>
  );
}
