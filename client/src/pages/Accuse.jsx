// client/src/pages/Accuse.jsx
// Pick a suspect, optionally explain why, and confirm the accusation.

import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, FolderSearch, Gavel, User } from "lucide-react";
import { accuseSuspect, getCase } from "../services/api.js";
import { EXPLANATION_MAX } from "../constants.js";
import { ConfirmDialog, EmptyState, ErrorBox, Spinner, useToast } from "../components/UI.jsx";
import usePageTitle from "../hooks/usePageTitle.js";

export default function Accuse() {
  usePageTitle("Accusation");
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [explanation, setExplanation] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit() {
    if (!selected || submitting) return;
    setSubmitting(true);
    try {
      await accuseSuspect(id, selected, explanation.trim());
      navigate(`/case/${id}/result`);
    } catch (err) {
      setConfirmOpen(false);
      if (err.code === "CASE_COMPLETED") {
        navigate(`/case/${id}/result`, { replace: true });
        return;
      }
      toast.notify(err.message, "error");
      setSubmitting(false);
    }
  }

  if (loading) return <Spinner label="Preparing the accusation..." />;

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

  const selectedSuspect = data.suspects.find((suspect) => suspect.id === selected);

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        to={`/case/${id}`}
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-gold-300"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to the investigation
      </Link>

      <div className="mt-4 text-center">
        <p className="eyebrow">Final step</p>
        <h1 className="mt-2 text-3xl sm:text-4xl">Who did it?</h1>
        <p className="mt-3 text-slate-400">
          {data.title}. You have found {data.progress.cluesDiscovered} of {data.progress.totalClues}{" "}
          clues. Choose carefully, because you only get one accusation.
        </p>
      </div>

      <div
        className="mt-8 grid gap-4 sm:grid-cols-2"
        role="radiogroup"
        aria-label="Choose a suspect to accuse"
      >
        {data.suspects.map((suspect) => {
          const isSelected = selected === suspect.id;
          return (
            <button
              key={suspect.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => setSelected(suspect.id)}
              className={`rounded-2xl border p-5 text-left transition ${
                isSelected
                  ? "border-gold-400 bg-gold-500/10 shadow-glow"
                  : "border-white/10 bg-white/5 hover:border-gold-400/50"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="flex items-center gap-2 text-xl">
                  <User className="h-5 w-5 text-gold-400" aria-hidden="true" />
                  {suspect.name}
                </h2>
                {isSelected && (
                  <CheckCircle2 className="h-6 w-6 shrink-0 text-gold-400" aria-hidden="true" />
                )}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">{suspect.description}</p>
              <p className="mt-2 text-sm">
                <span className="font-semibold text-gold-300">Motive: </span>
                <span className="text-slate-300">{suspect.motive}</span>
              </p>
            </button>
          );
        })}
      </div>

      <div className="glass mt-8 p-5 sm:p-6">
        <label htmlFor="explanation" className="mb-2 block text-sm font-semibold">
          Explain your reasoning <span className="font-normal text-slate-500">(optional)</span>
        </label>
        <textarea
          id="explanation"
          rows={4}
          maxLength={EXPLANATION_MAX}
          className="field resize-y"
          placeholder="Which clues convinced you?"
          value={explanation}
          onChange={(event) => setExplanation(event.target.value)}
        />
        <p className="mt-2 text-right text-xs text-slate-500">
          {explanation.length}/{EXPLANATION_MAX}
        </p>
      </div>

      <div className="mt-6 flex flex-col items-center gap-2">
        <button
          type="button"
          className="btn-gold w-full py-4 text-base sm:w-auto sm:px-10"
          onClick={() => setConfirmOpen(true)}
          disabled={!selected}
        >
          <Gavel className="h-5 w-5" aria-hidden="true" />
          Submit Accusation
        </button>
        {!selected && <p className="text-xs text-slate-500">Select a suspect first.</p>}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Make your accusation?"
        message={`You are accusing ${selectedSuspect ? selectedSuspect.name : "this suspect"}. This is final and cannot be undone.`}
        confirmLabel="Yes, accuse"
        danger
        busy={submitting}
        onConfirm={handleSubmit}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
