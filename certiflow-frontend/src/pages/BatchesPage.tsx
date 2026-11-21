import { useQuery } from "@tanstack/react-query";
import { Search, SlidersHorizontal, ArrowUpRight } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getBatches } from "../services/batch.service";
import StatusBadge from "../components/StatusBadge";
import { getErrorMessage } from "../lib/http";

export default function BatchesPage() {
  const { data: batches = [], isLoading, isError, error } = useQuery({ queryKey: ["batches"], queryFn: getBatches });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const filtered = useMemo(() => batches.filter((b) =>
    (status === "ALL" || b.status === status) &&
    `${b.batchCode} ${b.name} ${b.trainingCentre?.name ?? ""}`.toLowerCase().includes(search.toLowerCase())
  ), [batches, search, status]);

  return <div className="page-stack">
    <section className="page-intro"><div><div className="eyebrow">BATCH MANAGEMENT</div><h2>All batches</h2><p>Monitor submissions, approval progress, and candidate groups.</p></div><div className="count-chip">{batches.length} total records</div></section>
    <section className="panel">
      <div className="toolbar"><div className="search-box"><Search size={17} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by batch code or programme..." /></div><div className="filter-box"><SlidersHorizontal size={16} /><select value={status} onChange={(e) => setStatus(e.target.value)}><option value="ALL">All statuses</option>{["DRAFT","SUBMITTED","DISTRICT_REVIEW","QUALITY_REVIEW","STATE_REVIEW","RETURNED","REJECTED","APPROVED"].map((s) => <option key={s} value={s}>{s.replaceAll("_", " ")}</option>)}</select></div></div>
      {isLoading ? <div className="empty-state">Loading batches...</div> : isError ? <div className="inline-alert">{getErrorMessage(error)}</div> : filtered.length === 0 ? <div className="empty-state"><strong>No matching batches</strong><span>Try changing your search or status filter.</span></div> :
        <div className="table-wrap"><table><thead><tr><th>Batch code</th><th>Programme</th><th>Training centre</th><th>Submitted</th><th>Status</th><th></th></tr></thead><tbody>{filtered.map((b) => <tr key={b.id}><td><Link className="table-primary" to={`/batches/${b.id}`}>{b.batchCode}</Link></td><td>{b.name}</td><td>{b.trainingCentre?.name ?? "—"}</td><td>{b.submittedAt ? new Date(b.submittedAt).toLocaleDateString() : "—"}</td><td><StatusBadge status={b.status} /></td><td><Link className="row-action" to={`/batches/${b.id}`}><ArrowUpRight size={16} /></Link></td></tr>)}</tbody></table></div>}
    </section>
  </div>;
}
