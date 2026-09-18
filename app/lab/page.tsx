import Link from "next/link";
import { experiments } from "@/lab/registry";

export default function LabIndex() {
  return (
    <main className="page">
      <h1>Lab</h1>
      <p>Each entry is an isolated experiment. Open one, judge it, record the verdict in its README.</p>
      <ul>
        {experiments.map((e) => (
          <li key={e.slug}>
            <Link href={`/lab/${e.slug}`}>{e.title}</Link>
            <small>
              {e.description} · {e.added}
            </small>
          </li>
        ))}
      </ul>
      <p>
        <Link href="/">← Home</Link>
      </p>
    </main>
  );
}
