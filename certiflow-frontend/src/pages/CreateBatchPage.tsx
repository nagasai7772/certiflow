import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, FileSpreadsheet, UploadCloud, CheckCircle2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createBatch, uploadCandidates } from "../services/batch.service";
import { getErrorMessage } from "../lib/http";

export default function CreateBatchPage() {
  const [batchCode, setBatchCode] = useState("");
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [created, setCreated] = useState<{ id: string; batchCode: string } | null>(null);
  const [notice, setNotice] = useState("");
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const createMutation = useMutation({
    mutationFn: () => createBatch({ batchCode: batchCode.trim(), name: name.trim() }),
    onSuccess: (result) => {
      const batch = result?.batch ?? result;
      if (!batch?.id) { setNotice("Batch created, but the API response did not include its ID. Check the response mapping in batch.service.ts."); return; }
      setCreated({ id: batch.id, batchCode: batch.batchCode ?? batchCode });
      queryClient.invalidateQueries({ queryKey: ["batches"] });
    },
  });

  const uploadMutation = useMutation({
    mutationFn: () => {
      if (!created || !file) throw new Error("Create a batch and choose a CSV file first.");
      return uploadCandidates(created.id, file);
    },
    onSuccess: () => { setNotice("Candidate CSV uploaded successfully."); queryClient.invalidateQueries({ queryKey: ["batches"] }); },
  });

  const onCreate = (e: FormEvent) => { e.preventDefault(); setNotice(""); createMutation.mutate(); };
  const onUpload = (e: FormEvent) => { e.preventDefault(); setNotice(""); uploadMutation.mutate(); };
  const error = createMutation.error || uploadMutation.error;

  return <div className="page-stack narrow-page">
    <Link to="/batches" className="back-link"><ArrowLeft size={16} /> Back to batches</Link>
    <section className="page-intro"><div><div className="eyebrow">TRAINING CENTRE</div><h2>Create a training batch</h2><p>Start a batch, then upload the candidate roster as a CSV file.</p></div></section>
    <section className="panel form-panel">
      <div className="step-heading"><span className="step-index">01</span><div><h3>Batch information</h3><p>Enter the batch identifier and programme name.</p></div></div>
      <form onSubmit={onCreate} className="form-grid">
        <div className="field"><label>Batch code</label><input value={batchCode} onChange={(e) => setBatchCode(e.target.value)} placeholder="e.g. HYD-2026-003" required disabled={!!created} /></div>
        <div className="field"><label>Programme / batch name</label><input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Full Stack Development" required disabled={!!created} /></div>
        {!created ? <button className="primary-button form-submit" disabled={createMutation.isPending}>{createMutation.isPending ? "Creating..." : "Create batch"}</button> : <div className="success-strip"><CheckCircle2 size={18} /><span>Batch <strong>{created.batchCode}</strong> created successfully.</span></div>}
      </form>
    </section>

    <section className={`panel form-panel ${!created ? "panel-disabled" : ""}`}>
      <div className="step-heading"><span className="step-index">02</span><div><h3>Upload candidate roster</h3><p>Upload a CSV file containing candidate information.</p></div></div>
      <form onSubmit={onUpload}>
        <label className="upload-zone">
          <input type="file" accept=".csv,text/csv" onChange={(e) => setFile(e.target.files?.[0] ?? null)} disabled={!created} />
          <div className="upload-icon"><UploadCloud size={24} /></div>
          <strong>{file ? file.name : "Choose a CSV file"}</strong>
          <span>{file ? `${(file.size / 1024).toFixed(1)} KB · Ready to upload` : "Select a .csv file from your computer"}</span>
          <small><FileSpreadsheet size={14} /> CSV format · Maximum 2 MB</small>
        </label>
        <div className="form-actions"><button type="submit" className="primary-button" disabled={!created || !file || uploadMutation.isPending}>{uploadMutation.isPending ? "Uploading..." : "Upload candidates"}</button>{created && <button type="button" className="secondary-button" onClick={() => navigate(`/batches/${created.id}`)}>View batch</button>}</div>
      </form>
    </section>
    {notice && <div className="success-strip"><CheckCircle2 size={18} />{notice}</div>}
    {error && <div className="inline-alert">{getErrorMessage(error)}</div>}
    <div className="info-note"><FileSpreadsheet size={17} /><div><strong>CSV structure</strong><span>Use the column headers expected by your backend validator. Confirm the exact headers in <code>batch.validator.ts</code> before uploading.</span></div></div>
  </div>;
}
