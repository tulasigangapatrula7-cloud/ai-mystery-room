// client/src/pages/Case.jsx
// The Investigation Room: story, suspects, clues, hints, and progress.

import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  FolderSearch,
  Gavel,
  KeyRound,
  Lightbulb,
  MapPin,
  Search,
  ScrollText,
  User,
} from "lucide-react";
import {
  clearCurrentCase,
  discoverClue,
  getCase,
  requestHint,
  saveCurrentCase,
} from "../services/api.js";
import { ConfirmDialog, EmptyState, ErrorBox, Spinner, useToast } from "../components/UI.jsx";
import usePageTitle from "../hooks/usePageTitle.js";

export default function Case() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyClue, setBusyClue] = useState(null);
  const [hintBusy, setHintBusy] = useState(false);
  const [confirmHint, setConfirmHint] = useState(false);

  usePageTitle(data ? data.title : "Investigation");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const loaded = await getCase(id);
      if (loaded.status === "completed") {
        navigate(`/case/${id}/result`, { replace: true });
        return;
      }
      setData(loaded);
      saveCurrentCase(id);
    } catch (err) {
      if (err.code === "CASE_NOT_FOUND" || err.code === "VALIDATION_ERROR" || err.code === "INVALID_ID") {
        clearCurrentCase();
      }
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDiscover(clueId) {
    if (busyClue) return;
    setBusyClue(clueId);
    try {
      const { alreadyDiscovered, ...updated } = await discoverClue(id, clueId);
      setData(updated);
      if (alreadyDiscovered) {
        toast.notify("You already found that clue.", "info");
      } else {
        toast.notify("Clue discovered! +5 points", "success");
      }
    } catch (err) {
      if (err.code === "CASE_COMPLETED") {
        navigate(`/case/${id}/result`, { replace: true });
        return;
      }
      toast.notify(err.message, "error");
    } finally {
      setBusyClue(null);
    }
  }

  async function handleHint() {
    setHintBusy(true);
    try {
      const result = await requestHint(id);
      setData(result.case);
      setConfirmHint(false);
      toast.notify("Hint revealed. -10 points", "info");
    } catch (err) {
      setConfirmHint(false);
      if (err.code === "CASE_COMPLETED") {
        navigate(`/case/${id}/result`, { replace: true });
        return;
      }
      toast.notify(err.message, "error");
    } finally {
      setHintBusy(false);
    }
  }

  // ----- States: loading, error, not found -----
  if (loading) return <Spinner label="Opening the case file..." />;

  if (error) {
    const missing =
      error.code === "CASE_NOT_FOUND" ||
      error.code === "VALIDATION_ERROR" ||
      error.code === "INVALID_ID";
    if (missing) {
      return (
        <div className="mx-auto max-w-xl">
          <EmptyState
            icon={FolderSearch}
            title="Case not found"
            text="This case does not exist or the link is wrong. Start a new investigation instead."
          >
            <Link to="/create" className="btn-gold mt-2">
              New Case
            </Link>
          </EmptyState>
        </div>
      );
    }
    return (
      <div className="mx-auto max-w-xl">
        <ErrorBox message={error.message} onRetry={load} />
      </div>
    );
  }

  if (!data) return null;

  const { progress } = data;
  const percent = Math.round((progress.cluesDiscovered / progress.totalClues) * 100);
  const hidden = data.clues.filter((clue) => !clue.discovered);
  const found = data.clues.filter((clue) => clue.discovered);

  return (
    <div className="space-y-8">
      {/* Title and progress */}
      <section className="glass-gold p-5 sm:p-8">
        <div className="flex flex-wrap items-center gap-3">
          <span className="badge">{data.difficulty}</span>
          <span className="text-xs text-slate-400">Case file</span>
        </div>
        <h1 className="mt-3 text-3xl sm:text-4xl">{data.title}</h1>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400">Clues discovered</p>
            <p className="mt-1 text-2xl font-semibold">
              {progress.cluesDiscovered}
              <span className="text-slate-500"> / {progress.totalClues}</span>
            </p>
            <div
              className="mt-2 h-2 overflow-hidden rounded-full bg-white/10"
              role="progressbar"
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Investigation progress"
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-gold-500 to-gold-300 transition-all duration-500"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400">Hints remaining</p>
            <p className="mt-1 text-2xl font-semibold">
              {progress.hintsRemaining}
              <span className="text-slate-500"> / {progress.totalHints}</span>
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:items-end sm:justify-center">
            <button
              type="button"
              className="btn-ghost w-full sm:w-auto"
              onClick={() => setConfirmHint(true)}
              disabled={progress.hintsRemaining === 0 || hintBusy}
            >
              <Lightbulb className="h-4 w-4" aria-hidden="true" />
              Request Hint
            </button>
            <Link to={`/case/${id}/accuse`} className="btn-gold w-full sm:w-auto">
              <Gavel className="h-4 w-4" aria-hidden="true" />
              Accuse Suspect
            </Link>
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="glass p-5 sm:p-8">
        <h2 className="flex items-center gap-2 text-2xl">
          <ScrollText className="h-6 w-6 text-gold-400" aria-hidden="true" />
          The case
        </h2>
        <p className="mt-4 whitespace-pre-line leading-relaxed text-slate-300">{data.story}</p>
      </section>

      {/* Suspects */}
      <section>
        <h2 className="mb-4 flex items-center gap-2 text-2xl">
          <User className="h-6 w-6 text-gold-400" aria-hidden="true" />
          Suspects
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.suspects.map((suspect) => (
            <article key={suspect.id} className="glass p-5">
              <h3 className="text-xl">{suspect.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">{suspect.description}</p>
              <p className="mt-3 text-sm">
                <span className="font-semibold text-gold-300">Motive: </span>
                <span className="text-slate-300">{suspect.motive}</span>
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* Clue board */}
      <section>
        <h2 className="mb-4 flex items-center gap-2 text-2xl">
          <Search className="h-6 w-6 text-gold-400" aria-hidden="true" />
          Places to search
        </h2>
        {hidden.length === 0 ? (
          <div className="glass p-6 text-center text-slate-300">
            You have found every clue. Time to name the culprit!
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {hidden.map((clue) => (
              <article key={clue.id} className="glass flex flex-col justify-between gap-4 p-5">
                <div>
                  <h3 className="text-lg">{clue.label}</h3>
                  <p className="mt-2 flex items-center gap-2 text-sm text-slate-400">
                    <MapPin className="h-4 w-4 shrink-0 text-gold-400" aria-hidden="true" />
                    {clue.location}
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-ghost w-full"
                  onClick={() => handleDiscover(clue.id)}
                  disabled={busyClue !== null}
                >
                  {busyClue === clue.id ? "Searching..." : "Discover clue"}
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Discovered clues */}
      <section>
        <h2 className="mb-4 flex items-center gap-2 text-2xl">
          <KeyRound className="h-6 w-6 text-gold-400" aria-hidden="true" />
          Discovered clues
        </h2>
        {found.length === 0 ? (
          <div className="glass p-6 text-center text-slate-400">
            Nothing yet. Search a location above to find your first clue.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {found.map((clue) => (
              <article key={clue.id} className="glass-gold p-5">
                <h3 className="text-lg">{clue.label}</h3>
                <p className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                  <MapPin className="h-3.5 w-3.5 text-gold-400" aria-hidden="true" />
                  {clue.location}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-slate-200">{clue.description}</p>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Hints */}
      <section>
        <h2 className="mb-4 flex items-center gap-2 text-2xl">
          <Lightbulb className="h-6 w-6 text-gold-400" aria-hidden="true" />
          Hints
        </h2>
        {data.revealedHints.length === 0 ? (
          <div className="glass p-6 text-center text-slate-400">
            No hints used yet. Each hint costs 10 points.
          </div>
        ) : (
          <ol className="space-y-3">
            {data.revealedHints.map((hint) => (
              <li key={hint.index} className="glass p-5 text-sm leading-relaxed text-slate-200">
                <span className="mr-2 font-semibold text-gold-300">Hint {hint.index + 1}:</span>
                {hint.text}
              </li>
            ))}
          </ol>
        )}
      </section>

      <ConfirmDialog
        open={confirmHint}
        title="Use a hint?"
        message={`This reveals the next hint and costs 10 points. You have ${progress.hintsRemaining} left.`}
        confirmLabel="Reveal hint"
        busy={hintBusy}
        onConfirm={handleHint}
        onCancel={() => setConfirmHint(false)}
      />
    </div>
  );
}
