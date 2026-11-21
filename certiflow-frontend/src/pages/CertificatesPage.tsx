import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, FileCheck2, ShieldCheck, Sparkles } from "lucide-react";
import { getBatches, issueCertificates } from "../services/batch.service";
import StatusBadge from "../components/StatusBadge";
import { getErrorMessage } from "../lib/http";

export default function CertificatesPage() {
  const { data: batches = [], isLoading, isError, error } = useQuery({ queryKey: ["batches"], queryFn: getBatches });
  const approved = batches.filter((b) => b.status === "APPROVED");
  const qc = useQueryClient();
  const [result, setResult] = useState<{ batchCode?: string; issuedCount?: number; certificates?: { certificateNumber: string; fileKey: string }[] } | null>(null);
  const mutation = useMutation({
    mutationFn: issueCertificates,
    onSuccess: (data) => { setResult(data); qc.invalidateQueries({ queryKey: ["batches"] }); },
  });

  return <div className="page-stack">
    <section className="page-intro"><div><div className="eyebrow">CREDENTIAL ISSUANCE</div><h2>Certificate management</h2><p>Generate individual PDF certificates for batches that have final approval.</p></div><div className="count-chip">{approved.length} eligible batches</div></section>
    <div className="info-note"><ShieldCheck size={18} /><div><strong>Controlled issuance</strong><span>Only State Officers can generate certificates. Each candidate receives a unique certificate number and QR verification token.</span></div></div>
    {mutation.error && <div className="inline-alert">{getErrorMessage(mutation.error)}</div>}
    {result && <section className="panel issuance-result"><div className="result-heading"><div className="metric-icon green"><BadgeCheck size={20} /></div><div><h3>Issuance request completed</h3><p>{result.issuedCount ?? 0} certificates generated for {result.batchCode ?? "selected batch"}.</p></div></div>
      {result.certificates?.length ? <div className="table-wrap"><table><thead><tr><th>Certificate number</th><th>Stored file</th></tr></thead><tbody>{result.certificates.map((c) => <tr key={c.certificateNumber}><td className="table-primary">{c.certificateNumber}</td><td><code>{c.fileKey}</code></td></tr>)}</tbody></table></div> : <p className="muted-copy">The backend returned no certificate details in this response.</p>}
    </section>}
    <section className="panel">
      <div className="panel-heading"><div><h3>Eligible batches</h3><p>Approved batches ready for certificate generation.</p></div><div className="small-count"><Sparkles size={15} /> Ready to issue</div></div>
      {isLoading ? <div className="empty-state">Loading approved batches...</div> : isError ? <div className="inline-alert">{getErrorMessage(error)}</div> : approved.length === 0 ? <div className="empty-state"><div className="empty-icon"><FileCheck2 size={22} /></div><strong>No approved batches yet</strong><span>Once a batch passes all approval stages, it will appear here.</span></div> :
        <div className="review-list">{approved.map((batch) => <div className="review-item" key={batch.id}>
          <div className="review-main"><div className="review-icon"><BadgeCheck size={19} /></div><div><strong>{batch.batchCode}</strong><span>{batch.name} · {batch.trainingCentre?.name ?? "Training centre"}</span><small>Submission version {batch.currentSubmissionVersion ?? 1}</small></div></div>
          <StatusBadge status={batch.status} />
          <button className="primary-button compact" disabled={mutation.isPending} onClick={() => mutation.mutate(batch.id)}>{mutation.isPending ? "Generating..." : "Generate certificates"}</button>
        </div>)}</div>}
    </section>
  </div>;
}
