// client/src/pages/Result.jsx
// Reveals the verdict, the culprit, the full solution, the evidence, and the score.

import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FolderSearch, RotateCcw, Trophy, XCircle, CheckCircle2 } from "lucide-react";
import { clearCurrentCase, getResult } from "../services/api.js";
import { EmptyState, ErrorBox, Spinner } from "../components/UI.jsx";
import usePageTitle from "../hooks/usePageTitle.js";

export default function Result() {
  usePageTitle("Case closed");
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getResult(id);
      setData(result);
      clearCurrentCase(); // the game is over, so "Current case" disappears
    } catch (err) {
      if (err.code === "CASE_NOT_COMPLETED") {
        navigate(`/case/${id}`, { replace: true });
        return;
      }
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    load();
  }, [load]);

  function playAgain() {
    clearCurrentCase();
    navigate("/create");
  }

  if (loading) return <Spinner label="Opening the sealed envelope..." />;

  if (error) {
    const missing =
      error.code === "CASE_NOT_FOUND" ||
      error.code === "VALIDATION_ERROR" ||
      error.code === "INVALID_ID";
    return (
      <div className="mx-auto max-w-xl">
        {missing ? (
          <EmptyState icon={FolderSearch} title="Case not found" text="This case does not exist.">
            <Link to="/create" className="btn-gold mt-2">
              New Case
            </Link>
          </EmptyState>
        ) : (
          <ErrorBox message={error.message} onRetry={load} />
        )}
      </div>
    );
  }

  if (!data) return null;

  const { scoreBreakdown: score } = data;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Verdict */}
      <section
        className={`fade-up rounded-2xl border p-6 text-center sm:p-10 ${
          data.isCorrect
            ? "border-emerald-500/50 bg-emerald-500/10"
            : "border-red-500/50 bg-red-500/10"
        }`}
      >
        {data.isCorrect ? (
          <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-400" aria-hidden="true" />
        ) : (
          <XCircle className="mx-auto h-14 w-14 text-red-400" aria-hidden="true" />
        )}
        <p className="eyebrow mt-4">{data.title}</p>
        <h1 className="mt-2 text-3xl sm:text-5xl">
          {data.isCorrect ? "Case solved!" : "Wrong accusation"}
        </h1>
        <p className="mt-3 text-slate-300">
          {data.isCorrect
            ? "Brilliant detective work. You named the right culprit."
            : "The real culprit slipped away this time. Read how it happened below."}
        </p>
      </section>

      {/* Who */}
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="glass-gold p-5">
          <p className="text-xs uppercase tracking-wider text-gold-300">The culprit</p>
          <h2 className="mt-2 text-2xl">{data.culprit ? data.culprit.name : "Unknown"}</h2>
          {data.culprit && (
            <p className="mt-2 text-sm text-slate-300">
              <span className="font-semibold text-gold-300">Motive: </span>
              {data.culprit.motive}
            </p>
          )}
        </div>
        <div className="glass p-5">
          <p className="text-xs uppercase tracking-wider text-slate-400">You accused</p>
          <h2 className="mt-2 text-2xl">
            {data.accusedSuspect ? data.accusedSuspect.name : "Unknown"}
          </h2>
          {data.playerExplanation && (
            <p className="mt-2 text-sm italic text-slate-300">"{data.playerExplanation}"</p>
          )}
        </div>
      </section>

      {/* Solution */}
      <section className="glass p-5 sm:p-8">
        <h2 className="text-2xl">What really happened</h2>
        <p className="mt-3 whitespace-pre-line leading-relaxed text-slate-300">{data.solution}</p>
        <h3 className="mt-6 text-xl">How the clues prove it</h3>
        <p className="mt-2 whitespace-pre-line leading-relaxed text-slate-300">{data.explanation}</p>
      </section>

      {/* Evidence */}
      <section>
        <h2 className="mb-4 text-2xl">Evidence against the culprit</h2>
        <div className="space-y-3">
          {data.evidence.map((item) => (
            <article key={item.clueId} className="glass p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-lg">{item.clueLabel || item.clueId}</h3>
                <span
                  className={`badge ${
                    item.wasDiscovered
                      ? ""
                      : "!border-slate-500/40 !bg-slate-500/10 !text-slate-400"
                  }`}
                >
                  {item.wasDiscovered ? "You found this" : "You missed this"}
                </span>
              </div>
              {item.clueDescription && (
                <p className="mt-2 text-sm text-slate-400">{item.clueDescription}</p>
              )}
              <p className="mt-3 text-sm leading-relaxed text-slate-200">
                <span className="font-semibold text-gold-300">Why it matters: </span>
                {item.explanation}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* Score */}
      <section className="glass-gold p-5 sm:p-8">
        <div className="flex items-center gap-3">
          <Trophy className="h-7 w-7 text-gold-400" aria-hidden="true" />
          <h2 className="text-2xl">Your score</h2>
        </div>
        <p className="mt-4 font-display text-6xl text-gold-300">{data.finalScore}</p>

        <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
          <div className="flex justify-between rounded-lg bg-white/5 px-4 py-3">
            <dt className="text-slate-400">Base score ({data.difficulty})</dt>
            <dd className="font-semibold">{score.base}</dd>
          </div>
          <div className="flex justify-between rounded-lg bg-white/5 px-4 py-3">
            <dt className="text-slate-400">Clue points ({data.cluesDiscovered} x 5)</dt>
            <dd className="font-semibold text-emerald-400">+{score.cluePoints}</dd>
          </div>
          <div className="flex justify-between rounded-lg bg-white/5 px-4 py-3">
            <dt className="text-slate-400">Hint penalty ({data.hintsUsed} x 10)</dt>
            <dd className="font-semibold text-red-400">-{score.hintPenalty}</dd>
          </div>
          <div className="flex justify-between rounded-lg bg-white/5 px-4 py-3">
            <dt className="text-slate-400">Clues discovered</dt>
            <dd className="font-semibold">
              {data.cluesDiscovered} / {data.totalClues}
            </dd>
          </div>
        </dl>
        {!data.isCorrect && (
          <p className="mt-4 text-xs text-slate-400">
            A wrong accusation earns no base score. The score never goes below 0.
          </p>
        )}
      </section>

      <div className="flex flex-col items-center gap-3 pb-4 sm:flex-row sm:justify-center">
        <button type="button" className="btn-gold w-full px-8 py-4 text-base sm:w-auto" onClick={playAgain}>
          <RotateCcw className="h-5 w-5" aria-hidden="true" />
          Play Again
        </button>
        <Link to="/" className="btn-ghost w-full py-4 sm:w-auto">
          Home
        </Link>
      </div>
    </div>
  );
}
