"use client";

import { useRef, useState, type FormEvent } from "react";
import {
  Coffee,
  Camera,
  AtSign,
  Globe,
  Send,
  Check,
  Volume2,
  VolumeX,
} from "lucide-react";

// lucide-react no longer ships branded social marks; we use generic glyphs.
const socials = [
  { label: "Instagram", href: "#", Icon: Camera },
  { label: "Twitter / X", href: "#", Icon: AtSign },
  { label: "Website", href: "#", Icon: Globe },
];

export default function Footer() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Ambience: muted by default. Drop a real file at /public/assets/ambience.mp3
  // (or swap the src below) to make this audible.
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  const toggleAmbience = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      a.pause();
      setPlaying(false);
    } else {
      a.muted = false;
      a.volume = 0.35;
      a.play()
        .then(() => setPlaying(true))
        .catch(() => setPlaying(false));
    }
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
    setEmail("");
    setTimeout(() => setSubmitted(false), 2400);
  };

  return (
    <footer
      id="visit"
      className="relative z-10 mt-20 border-t border-white/10 bg-black/40 backdrop-blur"
    >
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 px-6 py-16 md:grid-cols-3">
        {/* Brand + tagline */}
        <div className="md:col-span-1">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-[var(--accent-strong)] to-[var(--accent)] text-black">
              <Coffee size={18} strokeWidth={2.4} />
            </span>
            <span className="text-base font-semibold tracking-wide">
              Aura<span className="text-[var(--accent-strong)]">Brew</span>
            </span>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/60">
            A premium Philippine micro-roastery. Crafted slowly, served warmly,
            in the heart of the city.
          </p>
          <div className="mt-6 flex items-center gap-3">
            {socials.map(({ label, href, Icon }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                data-cursor="grow"
                className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/5 text-white/75 transition hover:border-[var(--accent)]/60 hover:text-white"
              >
                <Icon size={16} />
              </a>
            ))}
          </div>
        </div>

        {/* Link columns */}
        <div className="grid grid-cols-2 gap-8 text-sm md:col-span-1">
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.25em] text-white/45">
              Visit
            </h4>
            <ul className="mt-4 space-y-2 text-white/75">
              <li>Barangay Guisang-an</li>
              <li>Sto. Nino, South Cotabato</li>
              <li>Mon — Sun · 7am to 7pm</li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.25em] text-white/45">
              Company
            </h4>
            <ul className="mt-4 space-y-2 text-white/75">
              <li><a href="#origin" className="hover:text-white">Our story</a></li>
              <li><a href="#brews" className="hover:text-white">Menu</a></li>
              <li><a href="#" className="hover:text-white">Wholesale</a></li>
              <li><a href="#" className="hover:text-white">Careers</a></li>
            </ul>
          </div>
        </div>

        {/* Newsletter */}
        <div className="md:col-span-1">
          <h4 className="text-xs font-semibold uppercase tracking-[0.25em] text-white/45">
            Stay caffeinated
          </h4>
          <p className="mt-3 text-sm text-white/65">
            Seasonal lots, brew guides, and quiet thoughts — delivered every
            other Sunday.
          </p>
          <form
            onSubmit={onSubmit}
            className="glass mt-5 flex items-center gap-2 rounded-2xl p-1.5"
          >
            <input
              type="email"
              required
              placeholder="Louiejaemaravillosa2@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/35 focus:outline-none"
            />
            <button
              type="submit"
              data-cursor="grow"
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-[var(--accent-strong)] to-[var(--accent)] px-4 py-2 text-xs font-semibold text-black transition hover:brightness-110"
            >
              {submitted ? (
                <>
                  <Check size={14} /> Subscribed
                </>
              ) : (
                <>
                  <Send size={14} /> Join
                </>
              )}
            </button>
          </form>
          <p className="mt-3 text-[11px] text-white/35">
            By joining you agree to our terms. Unsubscribe anytime.
          </p>
        </div>
      </div>

      <div className="border-t border-white/5">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-6 text-xs text-white/40 sm:flex-row">
          <span>© {new Date().getFullYear()} Aura Brew. All rights reserved.</span>

          {/* Coffee-shop ambience toggle (muted by default) */}
          <button
            type="button"
            onClick={toggleAmbience}
            data-cursor="grow"
            aria-pressed={playing}
            className={`group inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] uppercase tracking-[0.25em] transition ${
              playing
                ? "border-[var(--accent-strong)]/60 bg-[var(--accent)]/10 text-white"
                : "border-white/10 bg-white/5 text-white/60 hover:text-white"
            }`}
          >
            {playing ? <Volume2 size={14} /> : <VolumeX size={14} />}
            <span>Ambience</span>
            <span
              className={`inline-block h-1.5 w-1.5 rounded-full transition ${
                playing
                  ? "bg-[var(--accent-strong)] shadow-[0_0_10px_rgba(231,178,126,0.9)]"
                  : "bg-white/25"
              }`}
            />
          </button>

          <span className="flex items-center gap-4">
            <a href="#" data-cursor="grow" className="hover:text-white/70">Privacy</a>
            <a href="#" data-cursor="grow" className="hover:text-white/70">Terms</a>
            <a href="#" data-cursor="grow" className="hover:text-white/70">Sustainability</a>
          </span>
        </div>
      </div>

      {/* Hidden audio element — placeholder src; replace with a real ambience clip */}
      <audio
        ref={audioRef}
        src="/assets/ambience.mp3"
        preload="none"
        loop
        muted
      />
    </footer>
  );
}
