import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <p className="text-xs uppercase tracking-[0.2em] text-yellow">404</p>
      <h1 className="mt-2 text-2xl font-semibold">This frame doesn’t exist.</h1>
      <p className="mt-2 text-sm text-muted">The page or creation you’re looking for isn’t here.</p>
      <Link href="/" className="mt-6 text-sm text-yellow hover:underline">
        Back home
      </Link>
    </div>
  );
}
