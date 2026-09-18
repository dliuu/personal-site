import Link from "next/link";

export default function Home() {
  return (
    <main className="page">
      <h1>personal-site</h1>
      <p>No direction chosen yet. Ideas are being tried in the lab.</p>
      <p>
        <Link href="/lab">Open the lab →</Link>
      </p>
    </main>
  );
}
