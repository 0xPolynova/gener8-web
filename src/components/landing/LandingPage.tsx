"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Clapperboard,
  Images,
  Music2,
  Repeat,
  Sparkles,
  Users,
  Wand2,
  Zap,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { WalletButton } from "@/components/wallet/WalletButton";
import { apiFetch } from "@/lib/api";
import type { VideoWithCreator } from "@/types";

const TOOLS = [
  { icon: Wand2, title: "Prompt to video", body: "Describe a shot and Wan 3.0 cuts it." },
  { icon: Users, title: "KOL styles", body: "Dress a creator, then drop the still into the prompt." },
  { icon: Repeat, title: "Remix", body: "Start from a clip already on the feed." },
  { icon: Clapperboard, title: "Omni box", body: "Images, video, and @mentions in one composer." },
  { icon: Sparkles, title: "15s and 30s", body: "Pick a length and stay in that cut." },
  { icon: Images, title: "Discover filters", body: "Trending, viral, tokens, memecoins, music." },
  { icon: Music2, title: "Music", body: "A lane for clips built around a track." },
  { icon: Zap, title: "Hold to create", body: "GENER8 in the wallet unlocks generation." },
];

const STORIES = [
  { tag: "Remix", stat: "Same motion", detail: "Swap the characters, keep the cut." },
  { tag: "KOLs", stat: "One face", detail: "Style the clothes. Leave the head alone." },
  { tag: "Discover", stat: "Hover", detail: "The feed plays when you pause on a tile." },
  { tag: "Tokens", stat: "Hold", detail: "Access follows the wallet, not a subscription." },
  { tag: "Length", stat: "15s / 30s", detail: "Filter the feed by the cut you want." },
  { tag: "Studio", stat: "Wan 3.0", detail: "One model, public or private when it finishes." },
];

const NOTES = [
  { tag: "Studio", title: "How a remix keeps the original cut", date: "Sep 18, 2026" },
  { tag: "Create", title: "What goes in the prompt besides words", date: "Sep 12, 2026" },
  { tag: "Feed", title: "Why 15s and 30s are separate lanes", date: "Sep 4, 2026" },
];

export function LandingPage() {
  const [videos, setVideos] = useState<VideoWithCreator[]>([]);

  useEffect(() => {
    let cancelled = false;
    apiFetch("/api/videos?filter=trending")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setVideos((data.videos ?? []).slice(0, 12));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const reel = videos.length ? [...videos, ...videos] : [];

  return (
    <div className="min-h-full bg-ink text-white">
      <header className="sticky top-0 z-40 border-b border-white/8 bg-ink/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-6 px-5">
          <Logo />
          <nav className="hidden items-center gap-1 md:flex">
            <Link href="/discover" className="rounded-lg px-3 py-1.5 text-[14px] font-medium text-white/70 hover:text-white">Discover</Link>
            <Link href="/gener8" className="rounded-lg px-3 py-1.5 text-[14px] font-medium text-white/70 hover:text-white">$GENER8</Link>
            <Link href="/discover" className="rounded-lg px-3 py-1.5 text-[14px] font-medium text-yellow">Studio</Link>
          </nav>
          <div className="ml-auto">
            <WalletButton />
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[920px] px-5 pb-8 pt-20 text-center md:pt-28">
        <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-yellow">Gener8</p>
        <h1 className="mt-4 text-[52px] font-semibold leading-[0.95] tracking-tight md:text-[84px]">
          Video that holds.
        </h1>
        <p className="mx-auto mt-6 max-w-[560px] text-[18px] leading-relaxed text-white/65">
          A token-gated studio for clips, remixes, and KOL looks. Make it, then put it on the feed.
        </p>
        <Link
          href="/discover"
          className="mt-8 inline-flex h-12 items-center gap-2 rounded-xl bg-yellow px-6 text-[15px] font-bold text-ink"
        >
          Open the studio
          <ArrowRight className="h-4 w-4" />
        </Link>
        <p className="mt-4 text-[13px] text-white/40">Hold GENER8 in a connected wallet</p>
      </section>

      <section className="overflow-hidden border-y border-white/8 py-6">
        <div className="marquee-track flex w-max gap-3 px-3">
          {reel.map((video, index) => (
            <div
              key={`${video.id}-${index}`}
              className="h-[220px] w-[140px] shrink-0 overflow-hidden rounded-xl border border-white/10 bg-surface"
            >
              {video.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={video.thumbnailUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-end bg-gradient-to-br from-white/10 to-transparent p-3 text-[11px] font-bold uppercase tracking-wide text-white/50">
                  Generated
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-[1200px] gap-8 px-5 py-14 md:grid-cols-3">
        {[
          ["Clips on the feed", "Public generations"],
          ["Wan 3.0", "The video model"],
          ["9:16", "The default frame"],
        ].map(([stat, label]) => (
          <div key={label} className="text-center">
            <p className="text-[40px] font-semibold tracking-tight text-yellow">{stat}</p>
            <p className="mt-1 text-[14px] text-white/45">{label}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto grid max-w-[1200px] gap-4 px-5 pb-20 md:grid-cols-3">
        {[
          ["Discover", "See what is already moving", ["Trending, viral, tokens, memecoins", "15 second and 30 second lanes", "Hover a tile and it plays"], "/discover", "Browse the feed"],
          ["Create", "One box for the whole shot", ["Prompt, images, and reference video", "Tag a KOL and a styled still", "Remix locks the cut you started from"], "/discover", "Start a clip"],
          ["Publish", "Land it on Discover", ["Public when you want the feed", "Private while you are still cutting", "Remix stays attached to the source"], "/creations", "Your creations"],
        ].map(([kicker, title, points, href, cta]) => (
          <article key={String(kicker)} className="flex flex-col rounded-2xl border border-white/8 bg-surface p-6">
            <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-yellow">{kicker as string}</p>
            <h2 className="mt-3 text-[28px] font-semibold leading-tight">{title as string}</h2>
            <ul className="mt-5 space-y-2 text-[15px] text-white/70">
              {(points as string[]).map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
            <Link href={href as string} className="mt-8 inline-flex items-center gap-1 text-[14px] font-bold text-white">
              {cta as string} <ArrowRight className="h-4 w-4" />
            </Link>
          </article>
        ))}
      </section>

      <section className="mx-auto max-w-[1200px] px-5 pb-20">
        <h2 className="text-[36px] font-semibold tracking-tight md:text-[48px]">The studio, in one place</h2>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {TOOLS.map((tool) => (
            <article key={tool.title} className="rounded-2xl border border-white/8 bg-elevated p-5">
              <tool.icon className="h-5 w-5 text-yellow" />
              <h3 className="mt-4 text-[16px] font-bold">{tool.title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-white/55">{tool.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-white/8 bg-surface/60">
        <div className="mx-auto grid max-w-[1200px] gap-8 px-5 py-16 md:grid-cols-3">
          {[
            ["Feed", "Hover to play"],
            ["Remix", "Motion stays"],
            ["Access", "Wallet hold"],
          ].map(([k, v]) => (
            <div key={k}>
              <p className="text-[42px] font-semibold tracking-tight">{v}</p>
              <p className="mt-2 text-[14px] text-white/45">{k}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-5 py-20">
        <h2 className="text-[36px] font-semibold tracking-tight md:text-[48px]">How a clip gets made</h2>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {STORIES.map((story) => (
            <article key={story.tag} className="rounded-2xl border border-white/8 bg-surface p-5">
              <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-yellow">{story.tag}</p>
              <p className="mt-4 text-[28px] font-semibold">{story.stat}</p>
              <p className="mt-2 text-[15px] text-white/60">{story.detail}</p>
              <Link href="/discover" className="mt-6 inline-block text-[13px] font-bold text-white">
                Open Discover
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-5 pb-20">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-[36px] font-semibold tracking-tight">From the studio</h2>
          <Link href="/discover" className="text-[14px] font-bold text-white/70">See the feed</Link>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {NOTES.map((note) => (
            <article key={note.title} className="rounded-2xl border border-white/8 bg-elevated p-5">
              <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-yellow">{note.tag}</p>
              <h3 className="mt-3 text-[20px] font-semibold leading-snug">{note.title}</h3>
              <p className="mt-4 text-[13px] text-white/40">{note.date}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-[1200px] gap-3 px-5 pb-20 md:grid-cols-4">
        {[
          ["Feed", "Discover is public. Hover plays the clip."],
          ["Wallet", "Connect Phantom or Solflare. The hold is the gate."],
          ["Model", "Wan 3.0 takes the prompt, the stills, and the remix."],
          ["Length", "15s and 30s are filters, not a setting buried in a menu."],
        ].map(([title, body]) => (
          <article key={title} className="rounded-2xl border border-white/8 p-5">
            <h3 className="text-[16px] font-bold">{title}</h3>
            <p className="mt-2 text-[14px] leading-relaxed text-white/55">{body}</p>
          </article>
        ))}
      </section>

      <section className="mx-auto max-w-[1200px] px-5 pb-16">
        <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-yellow px-8 py-10 text-ink md:flex-row md:items-center">
          <div>
            <h2 className="text-[32px] font-semibold leading-tight md:text-[40px]">Make the next clip from the feed.</h2>
            <p className="mt-2 text-[16px]">Connect, write the shot, and publish when it is ready.</p>
          </div>
          <Link href="/discover" className="inline-flex h-12 items-center rounded-xl bg-ink px-5 text-[15px] font-bold text-white">
            Go to Discover
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/8">
        <div className="mx-auto grid max-w-[1200px] gap-8 px-5 py-12 sm:grid-cols-2 md:grid-cols-4">
          {[
            ["Product", [["Discover", "/discover"], ["My Creations", "/creations"], ["$GENER8", "/gener8"]]],
            ["Create", [["Remix", "/discover"], ["KOL styles", "/discover"], ["15s / 30s", "/discover"]]],
            ["Feed", [["Trending", "/discover"], ["Viral", "/discover"], ["Music", "/discover"]]],
            ["Access", [["Connect wallet", "/discover"], ["Hold GENER8", "/gener8"]]],
          ].map(([title, links]) => (
            <div key={title as string}>
              <p className="text-[13px] font-bold uppercase tracking-[0.14em] text-white/40">{title as string}</p>
              <ul className="mt-3 space-y-2">
                {(links as [string, string][]).map(([label, href]) => (
                  <li key={label}>
                    <Link href={href} className="text-[14px] text-white/75 hover:text-white">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-white/8 px-5 py-5 text-center text-[13px] text-white/35">
          gener8
        </div>
      </footer>
    </div>
  );
}
