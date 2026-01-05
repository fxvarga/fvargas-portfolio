# Building a File Upload Component with Progress Tracking

Learn how to create a comprehensive file upload component featuring drag-and-drop functionality, progress tracking, and animated processing steps using React and TypeScript.

## What We're Building

Our file upload component includes:

- **Drag-and-drop file selection** with visual feedback
- **Progress bar animation** during upload simulation
- **Sequential processing steps** with subway-style navigation
- **TypeScript interfaces** for type safety
- **Responsive design** that works on all devices

TIP: Try dragging different file types onto the dropzone to see how the component handles various files!

## Prerequisites

Before we start, make sure you have:

- React 18+ installed
- TypeScript configured
- Basic understanding of React hooks (useState, useRef, useCallback)
- Familiarity with CSS animations and transitions

## Step 1: Component Structure and State Management

Let's start by defining our component structure and the state we'll need to manage the upload process.

```tsx
interface ProcessingStep {
  id: string;
  label: string;
  duration: number; // in milliseconds
  status: 'pending' | 'active' | 'completed';
}

const FileUploadProgress: React.FC<FileUploadProgressProps> = ({ className }) => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processingSteps: ProcessingStep[] = [
    { id: 'validate', label: 'Validating', duration: 1000, status: 'pending' },
    { id: 'analyze', label: 'Analyzing', duration: 1500, status: 'pending' },
    { id: 'process', label: 'Processing', duration: 2000, status: 'pending' },
    { id: 'optimize', label: 'Optimizing', duration: 1200, status: 'pending' },
    { id: 'complete', label: 'Complete', duration: 500, status: 'pending' },
  ];

  const [steps, setSteps] = useState(processingSteps);
  // ... rest of component
};
```

## Step 2: Drag and Drop Functionality

Implement the drag-and-drop handlers to allow users to select files by dragging them onto the dropzone.

```tsx
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
```

## Step 3: Upload Simulation

Create a realistic upload simulation that updates the progress bar over time.

```tsx
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
```

## Step 4: Processing Steps Animation

Implement the sequential processing steps that animate one by one after upload completion.

```tsx
const simulateProcessing = useCallback(async () => {
  if (!uploadedFile || uploadProgress < 100) return;

  setIsProcessing(true);
  setCurrentStep(0);

  // Reset steps
  setSteps(prev => prev.map(step => ({ ...step, status: 'pending' })));

  for (let i = 0; i < steps.length; i++) {
    setCurrentStep(i);
    setSteps(prev => prev.map((step, index) => ({
      ...step,
      status: index === i ? 'active' : index < i ? 'completed' : 'pending'
    })));

    await new Promise(resolve => setTimeout(resolve, steps[i].duration));
  }

  setIsProcessing(false);
}, [uploadedFile, uploadProgress, steps]);
```

## Step 5: Complete Component

Here's the complete file upload component with all features:

```tsx
// FileUploadProgress.tsx
import React, { useState, useRef, useCallback } from 'react';
import './FileUploadProgress.css';

interface ProcessingStep {
  id: string;
  label: string;
  duration: number;
  status: 'pending' | 'active' | 'completed';
}

interface FileUploadProgressProps {
  className?: string;
}

const FileUploadProgress: React.FC<FileUploadProgressProps> = ({ className }) => {
  // State management (as shown in Step 1)
  // Event handlers (as shown in Steps 2-4)

  return (
    <div className={`file-upload-progress-demo ${className || ''}`}>
      <div className="demo-header">
        <h4>File Upload with Progress</h4>
        <p>Drag and drop files or click to select. Watch the progress and processing steps.</p>
      </div>

      {/* Dropzone */}
      <div
        className={`dropzone ${uploadedFile ? 'has-file' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
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

      {/* Demo Controls */}
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

      {/* Demo Info */}
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
```

## Styling

The CSS includes styles for the dropzone, progress bar, processing steps, and responsive design:

```css
.dropzone {
  border: 2px dashed rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.02);
}

.dropzone:hover {
  border-color: rgba(194, 106, 45, 0.5);
  background: rgba(194, 106, 45, 0.05);
}

/* Processing steps with animations */
.step.active .step-circle {
  background: rgba(194, 106, 45, 0.2);
  border-color: #c26a2d;
  animation: pulse 1.5s infinite;
}

.step-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(194, 106, 45, 0.3);
  border-top: 2px solid #c26a2d;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
```

## Usage Examples

```tsx
// Basic usage
<FileUploadProgress />

// With custom styling
<FileUploadProgress className="my-custom-upload" />

// In a form context
<form>
  <FileUploadProgress />
  <button type="submit">Submit</button>
</form>
```

## Performance Considerations

WARNING: This demo uses simulated uploads. In production, implement proper file upload handling with libraries like react-dropzone or native fetch/XMLHttpRequest.

For real file uploads, consider:
- Using FormData for multipart uploads
- Implementing proper error handling
- Adding file type and size validation
- Using libraries like axios for HTTP requests with progress tracking

## Accessibility

Our component includes several accessibility features:

```tsx
// Hidden file input with proper labeling
<input
  ref={fileInputRef}
  type="file"
  onChange={handleFileSelect}
  style={{ display: 'none' }}
  aria-label="Select file to upload"
/>

// Keyboard navigation support
onClick={() => fileInputRef.current?.click()}
```

## Conclusion

You've built a comprehensive file upload component with progress tracking and animated processing steps! The component demonstrates advanced React patterns including state management, event handling, and CSS animations. Try extending it with real file upload functionality or additional processing steps.

---

## Related Tutorials

- [Building a Workflow Execution GUI with React](/blog/workflow-execution-gui)
- [Creating Magnetic Button Effects with React](/blog/magnetic-button-effect)
- [Animated Counters with Scroll Triggers](/blog/animated-counters)