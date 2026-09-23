"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { WalletButton } from "@/components/wallet/WalletButton";
import { apiFetch } from "@/lib/api";
import type { VideoWithCreator } from "@/types";

const TOOLS = [
  ["Prompt", "Write the shot. Wan makes the clip."],
  ["KOLs", "Keep the face. Change the clothes."],
  ["Remix", "New characters. Same cut."],
  ["Omni", "Text, photos, and video in one box."],
  ["Length", "15 seconds or 30."],
  ["Filters", "Trending, viral, tokens, music."],
  ["Music", "Clips built on a track."],
  ["Styles", "Five looks. Pick one."],
  ["Publish", "Public on the feed, or keep it private."],
];

const PILLARS: [string, string, string[], string, string][] = [
  ["Discover", "See what is already working.", ["Trending and viral", "15s and 30s", "Hover to play"], "Browse", "/discover"],
  ["Create", "Every format. One box.", ["Words and stills", "A KOL look", "A remix of the cut"], "Start", "/discover"],
  ["Publish", "Put it on the feed.", ["Public when it is ready", "Private while you cut", "Remix stays linked"], "Your clips", "/creations"],
  ["Tune", "Keep the ones that land.", ["Same face, new clothes", "Same motion, new cast", "Filter by length"], "Open filters", "/discover"],
];

const STORIES = [
  ["Remix", "Same cut", "Only the people change.", "New cast", "The motion stays."],
  ["KOLs", "Same face", "Only the outfit changes.", "5 looks", "Pick one."],
  ["Feed", "Hover", "The clip plays.", "9:16", "Full frame."],
  ["Wallet", "Hold", "That is the key.", "GENER8", "In the wallet."],
  ["Time", "15s", "Short cuts.", "30s", "Longer cuts."],
  ["Model", "Wan", "One model.", "3.0", "For the shot."],
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
        <div className="mx-auto flex h-16 max-w-[1200px] items-center px-6">
          <Logo />
          <nav className="ml-10 hidden items-center gap-7 text-[14px] font-medium text-white/60 md:flex">
            <Link href="/discover" className="hover:text-white">Discover</Link>
            <Link href="/gener8" className="hover:text-white">$GENER8</Link>
            <Link href="/discover" className="text-yellow">Studio</Link>
          </nav>
          <div className="ml-auto">
            <WalletButton />
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden pt-20 md:pt-28">
        <div className="pointer-events-none absolute left-1/2 top-8 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-yellow/15 blur-[150px]" />
        <div className="relative mx-auto max-w-[1100px] px-6 text-center">
          <h1 className="text-[72px] font-semibold leading-[0.86] tracking-[-0.05em] md:text-[140px]">
            Clips that
            <br />
            hold.
          </h1>
          <p className="mx-auto mt-6 max-w-[520px] text-[20px] font-light leading-[1.25] text-white/55">
            Prompt, remix, and publish. At the length you want.
          </p>
          <p className="mt-1 text-[20px] font-light leading-none text-white/55">From one clip to a full feed.</p>
          <Link href="/discover" className="mt-8 inline-flex h-12 items-center rounded-full bg-yellow px-6 text-[14px] font-bold text-ink">
            Open studio
          </Link>
          <p className="mt-4 text-[13px] font-light leading-none text-white/35">Hold GENER8 to create</p>
        </div>

        <div className="relative mt-14 overflow-hidden pb-8 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
          <div className="marquee-track flex w-max gap-3">
            {reel.map((video, index) => (
              <div key={`${video.id}-${index}`} className="h-[300px] w-[180px] shrink-0 overflow-hidden rounded-[20px] bg-surface">
                {video.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={video.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full bg-white/5" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <p className="py-10 text-center text-[15px] font-light leading-none text-white/35">Clips from the live feed</p>

      <section className="mx-auto grid max-w-[1100px] gap-10 px-6 py-16 md:grid-cols-3">
        {[
          ["On feed", "Public clips"],
          ["Wan 3.0", "The model"],
          ["9:16", "The frame"],
        ].map(([value, label]) => (
          <div key={label} className="text-center">
            <p className="text-[64px] font-semibold leading-none tracking-tight md:text-[80px]">{value}</p>
            <p className="mt-3 text-[16px] font-light leading-none text-white/40">{label}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto max-w-[920px] px-6 pb-8 pt-16 text-center">
        <h2 className="text-[48px] font-semibold leading-[0.95] tracking-tight md:text-[80px]">
          Built to make the next clip.
        </h2>
        <p className="mx-auto mt-5 max-w-[520px] text-[18px] font-light leading-[1.25] text-white/45">
          Find one. Make one. Put it up.
        </p>
      </section>

      <section className="mx-auto flex max-w-[1180px] flex-col gap-4 px-6 pb-24">
        {PILLARS.map(([kicker, title, lines, cta, href], index) => (
          <article key={kicker} className="grid items-center gap-8 rounded-[20px] bg-surface p-8 md:grid-cols-2 md:p-12">
            <div className={index % 2 ? "md:order-2" : ""}>
              <p className="text-[12px] font-semibold tracking-[0.18em] text-yellow">{kicker}</p>
              <h3 className="mt-4 max-w-[460px] text-[36px] font-semibold leading-[1.02] tracking-tight md:text-[48px]">{title}</h3>
              <ul className="mt-6 space-y-2 text-[16px] font-light leading-none text-white/50">
                {(lines as string[]).map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              <Link href={href} className="mt-8 inline-flex h-11 items-center rounded-full bg-yellow px-5 text-[14px] font-bold text-ink">
                {cta}
              </Link>
            </div>
            <div className={`h-[320px] overflow-hidden rounded-[20px] bg-elevated ${index % 2 ? "md:order-1" : ""}`}>
              {videos[index]?.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={videos[index].thumbnailUrl!} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full bg-gradient-to-br from-yellow/15 to-transparent" />
              )}
            </div>
          </article>
        ))}
      </section>

      <section className="mx-auto max-w-[1180px] px-6 pb-24">
        <h2 className="max-w-[720px] text-[48px] font-semibold leading-[0.95] tracking-tight md:text-[72px]">The whole studio</h2>
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map(([title, body]) => (
            <article key={title} className="min-h-[150px] rounded-[20px] border border-white/8 bg-elevated p-7">
              <h3 className="text-[28px] font-semibold leading-none">{title}</h3>
              <p className="mt-3 text-[16px] font-light leading-none text-white/45">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-white/8">
        <div className="mx-auto grid max-w-[1100px] gap-10 px-6 py-24 md:grid-cols-3">
          {[
            ["Hover", "It plays"],
            ["Remix", "Motion stays"],
            ["Hold", "You can create"],
          ].map(([n, l]) => (
            <div key={n}>
              <p className="text-[72px] font-semibold leading-none tracking-tight md:text-[88px]">{n}</p>
              <p className="mt-3 text-[16px] font-light leading-none text-white/40">{l}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1180px] px-6 py-24">
        <h2 className="text-[48px] font-semibold leading-none tracking-tight md:text-[64px]">How it works</h2>
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {STORIES.map(([tag, a, al, b, bl]) => (
            <article key={tag} className="min-h-[240px] rounded-[20px] border border-white/8 bg-surface p-7">
              <p className="text-[12px] font-semibold tracking-[0.16em] text-yellow">{tag}</p>
              <p className="mt-6 text-[40px] font-semibold leading-none">{a}</p>
              <p className="mt-1 text-[15px] font-light leading-none text-white/45">{al}</p>
              <p className="mt-5 text-[40px] font-semibold leading-none">{b}</p>
              <p className="mt-1 text-[15px] font-light leading-none text-white/45">{bl}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1180px] px-6 pb-24">
        <h2 className="text-[48px] font-semibold leading-none tracking-tight">Notes</h2>
        <p className="mt-3 text-[16px] font-light leading-none text-white/40">Three short things.</p>
        <div className="mt-8 grid gap-3 md:grid-cols-3">
          {[
            ["Remix", "The cut stays. The cast changes."],
            ["Prompt", "Photos and video sit in the same line."],
            ["Feed", "15s and 30s are their own buttons."],
          ].map(([title, body]) => (
            <article key={title} className="min-h-[200px] rounded-[20px] border border-white/8 p-7">
              <h3 className="text-[28px] font-semibold leading-[1.05]">{title}</h3>
              <p className="mt-3 text-[16px] font-light leading-none text-white/45">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-[1180px] gap-3 px-6 pb-24 md:grid-cols-4">
        {[
          ["Feed", "Public. Hover plays it."],
          ["Wallet", "Phantom or Solflare."],
          ["Model", "Wan 3.0."],
          ["Time", "15s or 30s."],
        ].map(([title, body]) => (
          <article key={title} className="min-h-[160px] rounded-[20px] border border-white/8 p-7">
            <h3 className="text-[24px] font-semibold leading-none">{title}</h3>
            <p className="mt-3 text-[15px] font-light leading-none text-white/45">{body}</p>
          </article>
        ))}
      </section>

      <section className="mx-auto max-w-[1180px] px-6 pb-16">
        <div className="rounded-[28px] bg-yellow px-8 py-14 text-ink md:px-14 md:py-16">
          <h2 className="max-w-[680px] text-[40px] font-semibold leading-[0.98] tracking-tight md:text-[64px]">
            Open the feed. Make the next one.
          </h2>
          <Link href="/discover" className="mt-8 inline-flex h-12 items-center rounded-full bg-ink px-6 text-[14px] font-bold text-white">
            Discover
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/8">
        <div className="mx-auto grid max-w-[1180px] gap-8 px-6 py-14 sm:grid-cols-2 md:grid-cols-4">
          {[
            ["Product", [["Discover", "/discover"], ["Creations", "/creations"], ["$GENER8", "/gener8"]]],
            ["Make", [["Remix", "/discover"], ["KOLs", "/discover"], ["15s / 30s", "/discover"]]],
            ["Feed", [["Trending", "/discover"], ["Viral", "/discover"], ["Music", "/discover"]]],
            ["Enter", [["Studio", "/discover"], ["Hold", "/gener8"]]],
          ].map(([title, links]) => (
            <div key={title as string}>
              <p className="text-[12px] font-semibold tracking-[0.16em] text-white/35">{title as string}</p>
              <ul className="mt-4 space-y-2">
                {(links as [string, string][]).map(([label, href]) => (
                  <li key={label}>
                    <Link href={href} className="text-[15px] font-light leading-none text-white/70 hover:text-white">{label}</Link>
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
