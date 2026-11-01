// client/src/pages/Home.jsx
// Landing page: introduction, how to play, difficulty previews, features.

import { Link } from "react-router-dom";
import {
  ArrowRight,
  Fingerprint,
  Gavel,
  Lightbulb,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import { DIFFICULTIES } from "../constants.js";
import usePageTitle from "../hooks/usePageTitle.js";

const STEPS = [
  {
    icon: Sparkles,
    title: "Choose a premise",
    text: "Describe any setting or crime. The AI writes a brand-new case just for you.",
  },
  {
    icon: Users,
    title: "Inspect the suspects",
    text: "Read each suspect's description and motive. Everyone has a secret.",
  },
  {
    icon: Search,
    title: "Hunt for clues",
    text: "Search locations one by one. Some clues point to the truth, others are red herrings.",
  },
  {
    icon: Gavel,
    title: "Make your accusation",
    text: "Name the culprit. Then see the full solution and your score.",
  },
];

const FEATURES = [
  {
    icon: Sparkles,
    title: "Endless AI cases",
    text: "Every mystery is generated fresh, so no two games are the same.",
  },
  {
    icon: ShieldCheck,
    title: "Solution stays sealed",
    text: "The culprit never reaches your browser until you accuse.",
  },
  {
    icon: Lightbulb,
    title: "Hints when stuck",
    text: "Ask for a nudge. Each hint costs points, so use them wisely.",
  },
  {
    icon: Trophy,
    title: "Fair scoring",
    text: "Points for every clue found. The server keeps score, so no cheating.",
  },
  {
    icon: Smartphone,
    title: "Play anywhere",
    text: "Built for phones, tablets and desktops. No sign-up needed.",
  },
  {
    icon: Fingerprint,
    title: "Solvable by design",
    text: "Each case is checked so the clues really do lead to one culprit.",
  },
];

// A decorative detective illustration drawn with SVG.
function DetectiveArt() {
  return (
    <svg
      viewBox="0 0 320 320"
      className="mx-auto h-64 w-64 sm:h-80 sm:w-80"
      role="img"
      aria-label="A magnifying glass over a fingerprint"
    >
      <defs>
        <radialGradient id="lens" cx="50%" cy="45%" r="60%">
          <stop offset="0%" stopColor="#e2bf5f" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#0f182e" stopOpacity="0.6" />
        </radialGradient>
        <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f0d78c" />
          <stop offset="100%" stopColor="#a8841a" />
        </linearGradient>
      </defs>
      <circle cx="160" cy="160" r="150" fill="none" stroke="#e2bf5f" strokeOpacity="0.12" />
      <circle cx="160" cy="160" r="120" fill="none" stroke="#e2bf5f" strokeOpacity="0.08" />
      <g stroke="#e2bf5f" strokeOpacity="0.55" strokeWidth="2.5" fill="none" strokeLinecap="round">
        <path d="M110 150 C110 110 210 110 210 150" />
        <path d="M122 160 C122 128 198 128 198 160 C198 180 190 190 186 204" />
        <path d="M134 170 C134 148 186 148 186 170 C186 186 182 196 176 210" />
        <path d="M146 180 C146 166 174 166 174 180 C174 192 172 200 168 214" />
        <path d="M158 190 C158 184 162 184 162 190 L162 220" />
      </g>
      <circle cx="160" cy="160" r="82" fill="url(#lens)" stroke="url(#gold)" strokeWidth="9" />
      <path d="M118 128 A60 60 0 0 1 160 106" fill="none" stroke="#fff" strokeOpacity="0.35" strokeWidth="5" strokeLinecap="round" />
      <line x1="218" y1="218" x2="280" y2="280" stroke="url(#gold)" strokeWidth="16" strokeLinecap="round" />
    </svg>
  );
}

export default function Home() {
  usePageTitle("");

  return (
    <div className="space-y-20 sm:space-y-28">
      {/* Hero */}
      <section className="grid items-center gap-10 md:grid-cols-2">
        <div className="fade-up text-center md:text-left">
          <p className="eyebrow">An AI-powered detective game</p>
          <h1 className="mt-4 text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
            AI Mystery <span className="text-gold-400">Room</span>
          </h1>
          <p className="mt-5 text-base leading-relaxed text-slate-300 sm:text-lg">
            Step into a case that has never been written before. Tell the AI what kind of mystery you
            want, search for clues, question the suspects, and name the culprit. One wrong accusation
            and the case slips away.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row md:justify-start">
            <Link to="/create" className="btn-gold pulse-glow px-8 py-4 text-base">
              Start Mystery <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
            <a href="#how-to-play" className="btn-ghost px-6 py-4">
              How to play
            </a>
          </div>
        </div>
        <div className="fade-up" style={{ animationDelay: "0.15s" }}>
          <DetectiveArt />
        </div>
      </section>

      {/* How to play */}
      <section id="how-to-play" className="scroll-mt-24">
        <div className="mb-10 text-center">
          <p className="eyebrow">How to play</p>
          <h2 className="mt-2 text-3xl sm:text-4xl">Four steps to solve the case</h2>
        </div>
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <li key={step.title} className="glass p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold-500/15 font-display text-lg text-gold-300">
                  {index + 1}
                </span>
                <step.icon className="h-6 w-6 text-gold-400" aria-hidden="true" />
              </div>
              <h3 className="mt-4 text-lg">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Difficulty */}
      <section>
        <div className="mb-10 text-center">
          <p className="eyebrow">Difficulty levels</p>
          <h2 className="mt-2 text-3xl sm:text-4xl">Pick your challenge</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {DIFFICULTIES.map((level) => (
            <article
              key={level.id}
              className={level.id === "medium" ? "glass-gold p-6" : "glass p-6"}
            >
              <h3 className="text-2xl">{level.name}</h3>
              <p className="mt-2 text-sm text-slate-400">{level.blurb}</p>
              <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-slate-500">Suspects</dt>
                  <dd className="text-lg font-semibold">{level.suspects}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Clues</dt>
                  <dd className="text-lg font-semibold">{level.clues}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Hints</dt>
                  <dd className="text-lg font-semibold">{level.hints}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Base score</dt>
                  <dd className="text-lg font-semibold text-gold-300">{level.base}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </section>

      {/* Features */}
      <section>
        <div className="mb-10 text-center">
          <p className="eyebrow">Why you will love it</p>
          <h2 className="mt-2 text-3xl sm:text-4xl">Built like a real investigation</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="glass p-6">
              <feature.icon className="h-7 w-7 text-gold-400" aria-hidden="true" />
              <h3 className="mt-4 text-lg">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{feature.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final call to action */}
      <section className="glass-gold px-6 py-12 text-center">
        <h2 className="text-3xl">The case file is open.</h2>
        <p className="mx-auto mt-3 max-w-xl text-slate-300">
          Your first mystery is a few seconds away. Choose a premise and begin.
        </p>
        <Link to="/create" className="btn-gold mt-6 px-8 py-4 text-base">
          Start Mystery <ArrowRight className="h-5 w-5" aria-hidden="true" />
        </Link>
      </section>
    </div>
  );
}
