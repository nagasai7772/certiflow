import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, FileUp, Send, Users } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { getBatches, getCandidates, submitBatch } from "../services/batch.service";
import { useAuth } from "../context/AuthContext";
import StatusBadge from "../components/StatusBadge";
import { getErrorMessage } from "../lib/http";

export default function BatchDetailsPage() {
  const { batchId = "" } = useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: batches = [] } = useQuery({ queryKey: ["batches"], queryFn: getBatches });
  const batch = batches.find((b) => b.id === batchId);
  const { data: candidates = [], isLoading, isError, error } = useQuery({ queryKey: ["candidates", batchId], queryFn: () => getCandidates(batchId), enabled: !!batchId });
  const submitMutation = useMutation({ mutationFn: () => submitBatch(batchId), onSuccess: () => { qc.invalidateQueries({ queryKey: ["batches"] }); } });

  return <div className="page-stack">
    <Link to="/batches" className="back-link"><ArrowLeft size={16} /> Back to batches</Link>
    <section className="page-intro"><div><div className="eyebrow">BATCH DETAILS</div><h2>{batch?.batchCode ?? "Batch"}</h2><p>{batch?.name ?? "Candidate roster and submission details"}</p></div>{batch && <StatusBadge status={batch.status} />}</section>
    <section className="metric-grid detail-metrics">
      <div className="metric-card"><div className="metric-icon blue"><Users size={19} /></div><div className="metric-label">Candidates</div><div className="metric-value">{isLoading ? "—" : candidates.length}</div><div className="metric-note">Roster records loaded</div></div>
      <div className="metric-card"><div className="metric-icon green"><CheckCircle2 size={19} /></div><div className="metric-label">Submission version</div><div className="metric-value">{batch?.currentSubmissionVersion ?? "—"}</div><div className="metric-note">Current review version</div></div>
      <div className="metric-card"><div className="metric-icon violet"><FileUp size={19} /></div><div className="metric-label">Batch status</div><div className="metric-value metric-status">{batch?.status?.replaceAll("_", " ") ?? "Not loaded"}</div><div className="metric-note">Current workflow stage</div></div>
    </section>
    <section className="panel">
      <div className="panel-heading"><div><h3>Candidate roster</h3><p>Candidate records associated with this batch</p></div>
        {user?.role === "TRAINING_CENTRE" && batch?.status === "DRAFT" && <button className="primary-button" onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending || candidates.length === 0}><Send size={16} /> {submitMutation.isPending ? "Submitting..." : "Submit batch"}</button>}
      </div>
      {submitMutation.error && <div className="inline-alert">{getErrorMessage(submitMutation.error)}</div>}
      {isError ? <div className="inline-alert">{getErrorMessage(error)}</div> : isLoading ? <div className="empty-state">Loading candidates...</div> : candidates.length === 0 ? <div className="empty-state"><Users size={22} /><strong>No candidates in this batch</strong><span>Upload a CSV roster before submitting the batch.</span></div> :
        <div className="table-wrap"><table><thead><tr><th>Registration number</th><th>Candidate name</th><th>Email</th><th>Phone</th></tr></thead><tbody>{candidates.map((c) => <tr key={c.id}><td className="table-primary">{c.registrationNumber}</td><td>{c.fullName}</td><td>{c.email ?? "—"}</td><td>{c.phone ?? "—"}</td></tr>)}</tbody></table></div>}
    </section>
  </div>;
}
