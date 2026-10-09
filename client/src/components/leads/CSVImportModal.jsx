import React, { useState, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  ArrowRight,
  FileCheck,
} from 'lucide-react';
import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalFooter,
} from '../common/Modal';
import Button from '../common/Button';
import { uploadLeadsCSV } from '../../api/leadApi';

export default function CSVImportModal({ isOpen, onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [importSummary, setImportSummary] = useState(null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    setError('');
    setImportSummary(null);

    const fileName = selectedFile.name.toLowerCase();
    if (!fileName.endsWith('.csv')) {
      setError('Please select a valid CSV file (.csv). Arbitrary file formats are not allowed.');
      setFile(null);
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File size exceeds 5MB limit. Please upload a smaller file.');
      setFile(null);
      return;
    }

    setFile(selectedFile);
  };

  const handleRemoveFile = () => {
    setFile(null);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const downloadSampleTemplate = () => {
    const csvContent =
      'name,email,phone,company,requirement,budget,status,priority\n' +
      'Alice Walker,alice.walker@apexcorp.com,+1 555-0192,Apex Corp,Enterprise cloud workflow automation,85000,new,high\n' +
      'Marcus Brody,mbrody@zenithlogistics.io,+1 555-0144,Zenith Logistics,Supply chain ERP integration,45000,contacted,medium\n' +
      'Samantha Lee,slee@vanguardtech.org,+1 555-0188,Vanguard Tech,Real-time telemetry monitoring,120000,qualified,urgent\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'leads_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please choose or drag a CSV file first.');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await uploadLeadsCSV(formData);
      setImportSummary(response.data);

      if (response.data && response.data.importedCount > 0 && onSuccess) {
        onSuccess(response.data);
      }
    } catch (err) {
      const errMsg =
        err.response?.data?.message || err.message || 'Failed to upload and import CSV.';
      setError(errMsg);
    } finally {
      setUploading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setImportSummary(null);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={uploading ? undefined : onClose}
      size="2xl"
      ariaLabelledBy="csv-modal-title"
    >
      <ModalHeader onClose={uploading ? undefined : onClose}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <div>
            <ModalTitle id="csv-modal-title">Import Leads from CSV</ModalTitle>
            <ModalDescription>
              Bulk upload prospective clients directly into your sales pipeline
            </ModalDescription>
          </div>
        </div>
      </ModalHeader>

      <ModalBody className="space-y-5">
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-800 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <div>
              <span className="font-bold">Import Error: </span>
              {error}
            </div>
          </div>
        )}

        {!importSummary ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Template Download Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-xs text-slate-600">
                <span className="font-bold text-slate-800">Need a sample template?</span>
                <p className="text-slate-500 mt-0.5 text-[11px]">
                  Download our pre-formatted CSV template with standard column headers.
                </p>
              </div>
              <Button
                variant="outline"
                size="xs"
                onClick={downloadSampleTemplate}
                icon={Download}
              >
                Download CSV Template
              </Button>
            </div>

            {/* Drag & Drop Upload Zone */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => !file && fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-2xl p-7 text-center transition ${
                dragActive
                  ? 'border-indigo-500 bg-indigo-50/50'
                  : file
                  ? 'border-emerald-300 bg-emerald-50/30'
                  : 'border-slate-300 hover:border-slate-400 bg-slate-50/50 cursor-pointer'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileChange}
                className="hidden"
                disabled={uploading}
                aria-label="Upload CSV file"
              />

              {!file ? (
                <div className="space-y-2.5">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-2xs">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      Click to choose or drag & drop your CSV file here
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Standard CSV files up to 5MB supported
                    </p>
                  </div>
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-200/70 text-slate-600">
                    Headers: name, email, phone, company, requirement, budget, status, priority
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-emerald-200 shadow-2xs">
                  <div className="flex items-center gap-3 text-left">
                    <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                      <FileCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 truncate max-w-xs sm:max-w-md">
                        {file.name}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {(file.size / 1024).toFixed(1)} KB • Ready for validation
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFile();
                    }}
                    disabled={uploading}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                    title="Remove selected file"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <ModalFooter className="-mx-6 -mb-6">
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                disabled={uploading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={!file}
                loading={uploading}
                icon={Upload}
              >
                {uploading ? 'Validating & Importing...' : 'Upload & Import Leads'}
              </Button>
            </ModalFooter>
          </form>
        ) : (
          /* Summary View */
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Total Rows
                </span>
                <div className="text-xl font-bold text-slate-900 mt-1">
                  {importSummary.totalRows}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Imported
                </span>
                <div className="text-xl font-bold text-emerald-800 mt-1">
                  {importSummary.importedCount}
                </div>
              </div>

              <div
                className={`p-3.5 rounded-xl border text-center ${
                  importSummary.failedCount > 0
                    ? 'bg-amber-50 border-amber-200'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <span
                  className={`text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 ${
                    importSummary.failedCount > 0 ? 'text-amber-700' : 'text-slate-500'
                  }`}
                >
                  {importSummary.failedCount > 0 && <AlertTriangle className="w-3.5 h-3.5" />}
                  Failed
                </span>
                <div
                  className={`text-xl font-bold mt-1 ${
                    importSummary.failedCount > 0 ? 'text-amber-800' : 'text-slate-700'
                  }`}
                >
                  {importSummary.failedCount}
                </div>
              </div>
            </div>

            {/* Error Breakdown */}
            {importSummary.errors && importSummary.errors.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
                  <span>Validation Error Details ({importSummary.errors.length} rows)</span>
                  <span className="text-[11px] font-normal text-slate-400">Row 1 is header</span>
                </div>

                <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100 bg-slate-50/50">
                  {importSummary.errors.map((item, idx) => (
                    <div key={idx} className="p-2.5 text-xs flex flex-col sm:flex-row sm:items-start justify-between gap-1.5">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-mono font-bold text-[10px]">
                          Row {item.row}
                        </span>
                        <span className="font-semibold text-slate-800 truncate max-w-xs">
                          {item.leadName}
                        </span>
                      </div>
                      <div className="text-rose-600 sm:text-right font-medium text-[11px]">
                        {item.errors.join('; ')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <ModalFooter className="-mx-6 -mb-6">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
              >
                Import Another File
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={onClose}
                rightIcon={ArrowRight}
              >
                Done & View Pipeline
              </Button>
            </ModalFooter>
          </div>
        )}
      </ModalBody>
    </Modal>
  );
}
