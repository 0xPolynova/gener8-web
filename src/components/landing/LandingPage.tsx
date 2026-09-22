"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
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
  { icon: Wand2, title: "Prompt", body: "Write the shot. Wan makes the clip." },
  { icon: Users, title: "KOLs", body: "Keep the face. Change the clothes." },
  { icon: Repeat, title: "Remix", body: "New characters. Same cut." },
  { icon: Clapperboard, title: "Omni", body: "Text, photos, and video in one box." },
  { icon: Sparkles, title: "Length", body: "15 seconds or 30." },
  { icon: Images, title: "Filters", body: "Trending, viral, tokens, music." },
  { icon: Music2, title: "Music", body: "Clips built on a track." },
  { icon: Zap, title: "Access", body: "Hold GENER8. Then create." },
];

const STORIES = [
  { tag: "Remix", stat: "Same cut", line: "Only the people change." },
  { tag: "KOLs", stat: "Same face", line: "Only the outfit changes." },
  { tag: "Feed", stat: "Hover", line: "The clip plays." },
  { tag: "Wallet", stat: "Hold", line: "That is the key." },
  { tag: "Time", stat: "15 / 30", line: "Pick a length." },
  { tag: "Model", stat: "Wan 3.0", line: "One model for the shot." },
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
      <header className="sticky top-0 z-40 border-b border-white/8 bg-ink/80 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1180px] items-center px-6">
          <Logo />
          <nav className="ml-10 hidden items-center gap-8 md:flex">
            <Link href="/discover" className="text-[15px] font-medium text-white/70 hover:text-white">Discover</Link>
            <Link href="/gener8" className="text-[15px] font-medium text-white/70 hover:text-white">$GENER8</Link>
            <Link href="/discover" className="text-[15px] font-semibold text-yellow">Studio</Link>
          </nav>
          <div className="ml-auto">
            <WalletButton />
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[980px] px-6 pb-16 pt-24 text-center md:pb-20 md:pt-36">
        <h1 className="text-[64px] font-semibold leading-[0.92] tracking-[-0.04em] md:text-[104px]">
          Make the clip.
        </h1>
        <p className="mx-auto mt-8 max-w-[520px] text-[20px] font-light leading-relaxed text-white/55">
          Prompt it. Remix it. Put it on the feed.
        </p>
        <Link
          href="/discover"
          className="mt-10 inline-flex h-14 items-center rounded-2xl bg-yellow px-8 text-[16px] font-bold text-ink"
        >
          Open studio
        </Link>
        <p className="mt-5 text-[14px] font-light text-white/35">Hold GENER8 to create</p>
      </section>

      <section className="overflow-hidden py-4">
        <div className="marquee-track flex w-max gap-4 px-4">
          {reel.map((video, index) => (
            <div
              key={`${video.id}-${index}`}
              className="h-[320px] w-[200px] shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-surface"
            >
              {video.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={video.thumbnailUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-end p-4 text-[13px] font-bold text-white/40">Clip</div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-[1180px] gap-10 px-6 py-24 md:grid-cols-3 md:py-32">
        {[
          ["On the feed", "Public clips"],
          ["Wan 3.0", "The model"],
          ["9:16", "The frame"],
        ].map(([value, label]) => (
          <div key={label} className="text-center">
            <p className="text-[56px] font-semibold tracking-tight text-white md:text-[64px]">{value}</p>
            <p className="mt-3 text-[16px] font-light text-white/40">{label}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto max-w-[1180px] px-6 pb-28">
        <h2 className="max-w-[720px] text-[44px] font-semibold leading-[1.05] tracking-tight md:text-[64px]">
          Three steps. Then it is live.
        </h2>
        <p className="mt-5 max-w-[480px] text-[18px] font-light text-white/45">
          Find a clip. Make the next one. Publish it.
        </p>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {[
            ["Discover", "See the feed", ["Trending and viral", "15s and 30s", "Hover to play"], "/discover", "Browse"],
            ["Create", "One box", ["Words and photos", "A KOL still", "A remix"], "/discover", "Start"],
            ["Publish", "Put it up", ["Public on Discover", "Or keep it private", "Remix stays linked"], "/creations", "Yours"],
          ].map(([kicker, title, lines, href, cta]) => (
            <article key={String(kicker)} className="flex min-h-[420px] flex-col rounded-3xl border border-white/8 bg-surface p-8 md:p-10">
              <p className="text-[12px] font-bold uppercase tracking-[0.2em] text-yellow">{kicker as string}</p>
              <h3 className="mt-6 text-[36px] font-semibold leading-none tracking-tight">{title as string}</h3>
              <ul className="mt-8 space-y-3 text-[17px] font-light text-white/55">
                {(lines as string[]).map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              <Link href={href as string} className="mt-auto pt-10 text-[15px] font-bold text-white">
                {cta as string}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1180px] px-6 pb-28">
        <h2 className="text-[44px] font-semibold tracking-tight md:text-[64px]">Everything in the studio</h2>
        <p className="mt-4 text-[18px] font-light text-white/45">Short tools. Clear jobs.</p>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TOOLS.map((tool) => (
            <article key={tool.title} className="min-h-[220px] rounded-3xl border border-white/8 bg-elevated p-7">
              <tool.icon className="h-6 w-6 text-yellow" />
              <h3 className="mt-8 text-[28px] font-semibold tracking-tight">{tool.title}</h3>
              <p className="mt-3 text-[16px] font-light leading-relaxed text-white/45">{tool.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-white/8">
        <div className="mx-auto grid max-w-[1180px] gap-12 px-6 py-24 md:grid-cols-3 md:py-28">
          {[
            ["Hover", "It plays"],
            ["Remix", "Motion stays"],
            ["Hold", "You can create"],
          ].map(([stat, line]) => (
            <div key={stat}>
              <p className="text-[64px] font-semibold leading-none tracking-tight md:text-[80px]">{stat}</p>
              <p className="mt-4 text-[18px] font-light text-white/40">{line}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1180px] px-6 py-28">
        <h2 className="text-[44px] font-semibold tracking-tight md:text-[64px]">How it works</h2>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {STORIES.map((story) => (
            <article key={story.tag} className="min-h-[280px] rounded-3xl border border-white/8 bg-surface p-8">
              <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-yellow">{story.tag}</p>
              <p className="mt-8 text-[48px] font-semibold leading-none tracking-tight">{story.stat}</p>
              <p className="mt-4 text-[18px] font-light text-white/50">{story.line}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1180px] px-6 pb-28">
        <h2 className="text-[44px] font-semibold tracking-tight md:text-[56px]">Notes</h2>
        <p className="mt-3 text-[18px] font-light text-white/45">Three things worth knowing.</p>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            ["Remix", "The cut stays. The cast changes."],
            ["Prompt", "Photos and video sit in the same line."],
            ["Feed", "15s and 30s are their own buttons."],
          ].map(([title, body]) => (
            <article key={title} className="min-h-[220px] rounded-3xl border border-white/8 bg-elevated p-8">
              <h3 className="text-[28px] font-semibold leading-tight">{title}</h3>
              <p className="mt-4 text-[17px] font-light text-white/45">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-[1180px] gap-4 px-6 pb-28 md:grid-cols-4">
        {[
          ["Feed", "Public. Hover plays it."],
          ["Wallet", "Phantom or Solflare."],
          ["Model", "Wan 3.0."],
          ["Time", "15s or 30s."],
        ].map(([title, body]) => (
          <article key={title} className="min-h-[180px] rounded-3xl border border-white/8 p-7">
            <h3 className="text-[24px] font-semibold">{title}</h3>
            <p className="mt-3 text-[16px] font-light text-white/45">{body}</p>
          </article>
        ))}
      </section>

      <section className="mx-auto max-w-[1180px] px-6 pb-20">
        <div className="flex flex-col justify-between gap-8 rounded-[28px] bg-yellow px-10 py-14 text-ink md:flex-row md:items-center md:px-14">
          <h2 className="max-w-[640px] text-[40px] font-semibold leading-[1.05] tracking-tight md:text-[56px]">
            Open the feed. Make the next one.
          </h2>
          <Link href="/discover" className="inline-flex h-14 shrink-0 items-center rounded-2xl bg-ink px-7 text-[16px] font-bold text-white">
            Discover
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/8">
        <div className="mx-auto grid max-w-[1180px] gap-10 px-6 py-16 sm:grid-cols-2 md:grid-cols-4">
          {[
            ["Product", [["Discover", "/discover"], ["Creations", "/creations"], ["$GENER8", "/gener8"]]],
            ["Make", [["Remix", "/discover"], ["KOLs", "/discover"], ["15s / 30s", "/discover"]]],
            ["Feed", [["Trending", "/discover"], ["Viral", "/discover"], ["Music", "/discover"]]],
            ["Enter", [["Studio", "/discover"], ["Hold", "/gener8"]]],
          ].map(([title, links]) => (
            <div key={title as string}>
              <p className="text-[13px] font-bold uppercase tracking-[0.16em] text-white/35">{title as string}</p>
              <ul className="mt-4 space-y-3">
                {(links as [string, string][]).map(([label, href]) => (
                  <li key={label}>
                    <Link href={href} className="text-[16px] font-light text-white/70 hover:text-white">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </footer>
    </div>
  );
}
