/**
 * File Upload Progress Demo Component
 *
 * A comprehensive file upload component featuring drag-and-drop,
 * progress tracking, and subway-style processing steps.
 */

import React, { useState, useRef, useCallback } from 'react';
import './FileUploadProgress.css';

interface ProcessingStep {
  id: string;
  label: string;
  duration: number; // in milliseconds
  status: 'pending' | 'active' | 'completed';
}

// 1. First, define the CORE component that users will learn to build
interface FileUploadProps {
  uploadedFile: File | null;
  uploadProgress: number;
  isUploading: boolean;
  isProcessing: boolean;
  steps: ProcessingStep[];
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

const FileUpload: React.FC<FileUploadProps> = ({
  uploadedFile,
  uploadProgress,
  isUploading,
  isProcessing,
  steps,
  onDrop,
  onDragOver,
  onFileSelect,
  fileInputRef
}) => {
  return (
    <div className="upload-showcase">
      {/* Dropzone */}
      <div
        className={`dropzone ${uploadedFile ? 'has-file' : ''}`}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={onFileSelect}
          style={{ display: 'none' }}
        />

        {uploadedFile ? (
          <div className="file-info">
            <div className="file-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
              </svg>
            </div>
            <div className="file-details">
              <div className="file-name">{uploadedFile.name}</div>
              <div className="file-size">{(uploadedFile.size / 1024).toFixed(1)} KB</div>
            </div>
          </div>
        ) : (
          <div className="dropzone-content">
            <div className="dropzone-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7,10 12,15 17,10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </div>
            <div className="dropzone-text">
              <p>Drop files here or click to browse</p>
              <small>Supports any file type</small>
            </div>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {uploadedFile && (
        <div className="progress-section">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <div className="progress-text">
            {isUploading ? `Uploading... ${Math.round(uploadProgress)}%` : 'Upload complete'}
          </div>
        </div>
      )}

      {/* Processing Steps */}
      {uploadedFile && uploadProgress >= 100 && (
        <div className="processing-steps">
          <div className="steps-container">
            {steps.map((step, index) => (
              <div key={step.id} className={`step ${step.status}`}>
                <div className="step-circle">
                  {step.status === 'completed' && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20,6 9,17 4,12"/>
                    </svg>
                  )}
                  {step.status === 'active' && (
                    <div className="step-spinner" />
                  )}
                </div>
                <div className="step-label">{step.label}</div>
                {index < steps.length - 1 && <div className="step-connector" />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// 2. Then, create the DEMO wrapper with interactive controls
interface FileUploadProgressProps {
  className?: string;
}

const FileUploadProgress: React.FC<FileUploadProgressProps> = ({ className }) => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processingSteps: ProcessingStep[] = [
    { id: 'validate', label: 'Validating', duration: 1000, status: 'pending' },
    { id: 'analyze', label: 'Analyzing', duration: 1500, status: 'pending' },
    { id: 'process', label: 'Processing', duration: 2000, status: 'pending' },
    { id: 'optimize', label: 'Optimizing', duration: 1200, status: 'pending' },
    { id: 'complete', label: 'Complete', duration: 500, status: 'pending' },
  ];

  const [steps, setSteps] = useState(processingSteps);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setUploadedFile(files[0]);
      setUploadProgress(0);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setUploadedFile(files[0]);
      setUploadProgress(0);
    }
  }, []);

  const simulateUpload = useCallback(() => {
    if (!uploadedFile) return;

    setIsUploading(true);
    setUploadProgress(0);

    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 100);
  }, [uploadedFile]);

  const simulateProcessing = useCallback(async () => {
    if (!uploadedFile || uploadProgress < 100) return;

    setIsProcessing(true);

    // Reset steps
    setSteps(prev => prev.map(step => ({ ...step, status: 'pending' })));

    for (let i = 0; i < steps.length; i++) {
      setSteps(prev => prev.map((step, index) => ({
        ...step,
        status: index === i ? 'active' : index < i ? 'completed' : 'pending'
      })));

      await new Promise(resolve => setTimeout(resolve, steps[i].duration));
    }

    setIsProcessing(false);
  }, [uploadedFile, uploadProgress, steps]);

  const resetDemo = useCallback(() => {
    setUploadedFile(null);
    setUploadProgress(0);
    setIsUploading(false);
    setIsProcessing(false);
    setSteps(prev => prev.map(step => ({ ...step, status: 'pending' })));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  return (
    <div className={`file-upload-progress-demo ${className || ''}`}>
      <div className="demo-header">
        <h4>File Upload with Progress</h4>
        <p>Drag and drop files or click to select. Watch the progress and processing steps.</p>
      </div>

      <FileUpload
        uploadedFile={uploadedFile}
        uploadProgress={uploadProgress}
        isUploading={isUploading}
        isProcessing={isProcessing}
        steps={steps}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onFileSelect={handleFileSelect}
        fileInputRef={fileInputRef}
      />

      <div className="demo-controls">
        <div className="control-group">
          <button
            className="demo-button"
            onClick={simulateUpload}
            disabled={!uploadedFile || isUploading || isProcessing}
          >
            {isUploading ? 'Uploading...' : 'Start Upload'}
          </button>

          <button
            className="demo-button process-button"
            onClick={simulateProcessing}
            disabled={!uploadedFile || uploadProgress < 100 || isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Process File'}
          </button>

          <button
            className="demo-button reset-button"
            onClick={resetDemo}
          >
            Reset
          </button>
        </div>
      </div>

      <div className="demo-info">
        <h5>How It Works</h5>
        <ul>
          <li>Drag and drop files or click to select</li>
          <li>Simulated upload with progress tracking</li>
          <li>Sequential processing steps with visual feedback</li>
          <li>Subway-style navigation showing current progress</li>
        </ul>
      </div>
    </div>
  );
};

export default FileUploadProgress;