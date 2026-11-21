import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, BadgeCheck, ClipboardList, Clock3, FileCheck2, Plus, ShieldCheck, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getBatches } from "../services/batch.service";
import StatusBadge from "../components/StatusBadge";

const roleGreeting: Record<string, string> = {
  TRAINING_CENTRE: "Track your training batches and candidate submissions.",
  DISTRICT_OFFICER: "Review incoming batches and keep district approvals moving.",
  QUALITY_OFFICER: "Complete quality checks and maintain submission standards.",
  STATE_OFFICER: "Manage final approvals and issue verified certificates.",
};

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: batches = [], isLoading, isError, error } = useQuery({ queryKey: ["batches"], queryFn: getBatches });
  const approved = batches.filter((b) => b.status === "APPROVED").length;
  const pending = batches.filter((b) => ["SUBMITTED", "DISTRICT_REVIEW", "QUALITY_REVIEW", "STATE_REVIEW"].includes(b.status)).length;
  const drafts = batches.filter((b) => b.status === "DRAFT").length;

  return (
    <div className="page-stack">
      <section className="welcome-row">
        <div><div className="eyebrow">YOUR WORKSPACE</div><h2>Good to see you, {user?.name?.split(" ")[0] ?? "there"}.</h2><p>{roleGreeting[user?.role ?? ""]}</p></div>
        {user?.role === "TRAINING_CENTRE" && <Link className="primary-button" to="/create-batch"><Plus size={17} /> Create batch</Link>}
      </section>

      <section className="metric-grid">
        <Metric icon={<ClipboardList size={19} />} label="Total batches" value={isLoading ? "—" : String(batches.length)} tone="blue" note="Across your workspace" />
        <Metric icon={<Clock3 size={19} />} label="In review" value={isLoading ? "—" : String(pending)} tone="amber" note="Awaiting workflow action" />
        <Metric icon={<BadgeCheck size={19} />} label="Approved" value={isLoading ? "—" : String(approved)} tone="green" note="Final approval completed" />
        <Metric icon={<FileCheck2 size={19} />} label="Draft batches" value={isLoading ? "—" : String(drafts)} tone="violet" note="Not yet submitted" />
      </section>

      <section className="content-grid">
        <div className="panel recent-panel">
          <div className="panel-heading"><div><h3>Recent batches</h3><p>Latest activity across your batches</p></div><Link to="/batches" className="text-link">View all <ArrowUpRight size={15} /></Link></div>
          {isError ? <div className="inline-alert">Could not load batches: {(error as Error).message}. Check the batch list endpoint configuration.</div> :
            isLoading ? <div className="empty-state">Loading batches...</div> :
            batches.length === 0 ? <div className="empty-state"><div className="empty-icon"><ClipboardList size={22} /></div><strong>No batches found</strong><span>When batches are created, they'll appear here.</span></div> :
            <div className="table-wrap"><table><thead><tr><th>Batch</th><th>Programme</th><th>Status</th><th>Centre</th></tr></thead><tbody>{batches.slice(0, 5).map((batch) => <tr key={batch.id}><td><Link className="table-primary" to={`/batches/${batch.id}`}>{batch.batchCode}</Link></td><td>{batch.name}</td><td><StatusBadge status={batch.status} /></td><td>{batch.trainingCentre?.name ?? "—"}</td></tr>)}</tbody></table></div>}
        </div>
        <div className="panel workflow-panel">
          <div className="panel-heading"><div><h3>Approval journey</h3><p>How a batch moves through CertiFlow</p></div></div>
          <div className="journey">
            {[
              ["01", "Training Centre", "Create and submit batch"],
              ["02", "District Officer", "Review submitted records"],
              ["03", "Quality Officer", "Verify quality and eligibility"],
              ["04", "State Officer", "Final approval and issuance"],
            ].map(([n, title, desc], i) => <div className="journey-step" key={n}><div className={`journey-number ${i === 3 ? "last" : ""}`}>{n}</div><div><strong>{title}</strong><span>{desc}</span></div></div>)}
          </div>
          <div className="workflow-foot"><ShieldCheck size={17} /><span>Each decision is recorded for accountability.</span></div>
        </div>
      </section>
      <div className="dashboard-footnote"><ShieldCheck size={15} /> Signed in as <strong>{user?.role?.replaceAll("_", " ")}</strong></div>
    </div>
  );
}

function Metric({ icon, label, value, tone, note }: { icon: React.ReactNode; label: string; value: string; tone: string; note: string }) {
  return <div className="metric-card"><div className={`metric-icon ${tone}`}>{icon}</div><div className="metric-label">{label}</div><div className="metric-value">{value}</div><div className="metric-note">{note}</div></div>;
}
