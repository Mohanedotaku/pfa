import { useState, useCallback, useEffect, useRef } from "react";
import axios from "axios";
import { useDropzone } from "react-dropzone";

/**
 * Reusable FileUploader component
 * @param {Object} props - Component props
 * @param {string} props.title - Upload section title
 * @param {string} props.description - Description text
 * @param {string} props.fileType - Type of file (e.g., "teacher", "exam")
 * @param {string} props.acceptedFileTypes - MIME types of accepted files
 * @param {Array} props.acceptedExtensions - Array of accepted file extensions
 * @param {string} props.icon - Icon to display in the upload area
 * @param {string} props.uploadEndpoint - API endpoint for file upload
 * @param {function} props.onUploadSuccess - Callback on successful upload
 * @param {function} props.onUploadError - Callback on upload error
 */
const FileUploader = ({
  title,
  description,
  fileType,
  acceptedFileTypes = ".xlsx, .xls",
  acceptedExtensions = ["xlsx", "xls"],
  icon = "📊",
  uploadEndpoint = "/api/upload",
  onUploadSuccess,
  onUploadError,
}) => {
  const [file, setFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const cancelTokenSource = useRef(null);

  // Reset file state if component unmounts during upload
  useEffect(() => {
    return () => {
      if (cancelTokenSource.current) {
        cancelTokenSource.current.cancel("Component unmounted");
      }
    };
  }, []);

  // File validation function
  const validateFile = useCallback(
    (file) => {
      const maxSize = 10 * 1024 * 1024; // 10MB

      // Check file size
      if (file.size > maxSize) {
        return {
          valid: false,
          error: `File is too large. Maximum size is 10MB.`,
        };
      }

      // Check file extension
      const extension = file.name.split(".").pop().toLowerCase();
      if (!acceptedExtensions.includes(extension)) {
        return {
          valid: false,
          error: `Invalid file type. Only ${acceptedExtensions.join(
            ", "
          )} files are allowed.`,
        };
      }

      return { valid: true };
    },
    [acceptedExtensions]
  );

  // Handle the file drop or selection
  const onDrop = useCallback(
    (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        const selectedFile = acceptedFiles[0]; // Only accept one file
        const validation = validateFile(selectedFile);

        if (validation.valid) {
          setFile(selectedFile);
          setUploadError(null);
          setUploadSuccess(false);

          // Preview creation would go here if implemented
        } else {
          setUploadError(validation.error);
        }
      }
    },
    [validateFile]
  );

  // Configure dropzone
  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject,
  } = useDropzone({
    onDrop,
    accept: acceptedFileTypes,
    maxFiles: 1,
  });

  // Handle file upload
  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);

    // FOR TESTING: Log the endpoint that would be used (to avoid unused var warning)
    console.log(`Would upload to: ${uploadEndpoint}`);

    // Create form data
    const formData = new FormData();
    formData.append("file", file);
    // Backend expects 'file' as the form field name

    // Create cancel token
    cancelTokenSource.current = axios.CancelToken.source();

    try {
      // TESTING ONLY: Simulate progress updates
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += 10;
        setUploadProgress(progress);
        if (progress >= 100) {
          clearInterval(progressInterval);

          // Simulate successful response after progress completes
          setTimeout(() => {
            setUploadSuccess(true);
            setIsUploading(false); // Set isUploading to false when done
            if (onUploadSuccess) {
              // Simulate backend response
              onUploadSuccess({
                message: "Excel file processed successfully.",
              });
            }
          }, 500);
        }
      }, 200);

      /* 
      // ACTUAL API CALL - COMMENTED OUT FOR TESTING
      const response = await axios.post(uploadEndpoint, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        },
        cancelToken: cancelTokenSource.current.token,
      });

      setUploadSuccess(true);
      // Check for specific success message from backend
      if (
        response.data &&
        response.data.message === "Excel file processed successfully."
      ) {
        console.log("Backend returned success message");
      }
      if (onUploadSuccess) onUploadSuccess(response.data);
      */
    } catch (error) {
      if (axios.isCancel(error)) {
        setUploadError("Upload was cancelled");
      } else {
        setUploadError(
          error.response?.data?.message ||
            "Error uploading file. Please try again."
        );
        if (onUploadError) onUploadError(error);
      }
    } finally {
      // Not needed for testing as we set it in the setTimeout
      // setIsUploading(false);
    }
  };

  // Handle cancel upload
  const handleCancel = () => {
    if (isUploading && cancelTokenSource.current) {
      cancelTokenSource.current.cancel("Upload cancelled by user");
    }
  };

  // Handle retry
  const handleRetry = () => {
    setUploadError(null);
    setUploadSuccess(false);
    handleUpload();
  };

  // Handle clear file selection
  const handleClear = () => {
    setFile(null);
    setUploadProgress(0);
    setUploadError(null);
    setUploadSuccess(false);
  };

  // Get dropzone class names
  const getDropzoneClassName = () => {
    let className = "file-upload-label";

    if (isDragActive) className += " is-drag-active";
    if (isDragAccept) className += " is-drag-accept";
    if (isDragReject) className += " is-drag-reject";
    if (file) className += " has-file";

    return className;
  };

  return (
    <div className={`upload-section ${fileType}-section`}>
      <div className="section-header">
        <h2>{title}</h2>
        <p>{description}</p>
      </div>

      <div className={`file-upload ${fileType}-upload`}>
        <div {...getRootProps({ className: getDropzoneClassName() })}>
          <input
            {...getInputProps({ id: `${fileType}-file` })}
            aria-label={`Upload ${title}`}
          />

          <span className="file-upload-icon">{icon}</span>

          {!file && (
            <div className="upload-prompt">
              <span className="file-upload-text">
                {isDragActive
                  ? "Drop the file here"
                  : "Drag & drop an Excel file here, or click to select"}
              </span>
              <span className="file-format-hint">
                Accepted formats: {acceptedExtensions.join(", ")} (max 10MB)
              </span>
            </div>
          )}

          {file && (
            <div className="file-preview">
              <span className="file-upload-text">{file.name}</span>
            </div>
          )}
        </div>

        {file && (
          <div className="file-info">
            <div className="file-metadata">
              <p className="file-name">{file.name}</p>
              <p className="file-size">{(file.size / 1024).toFixed(2)} KB</p>
              <p className="file-type">Type: {file.type || "Excel Document"}</p>
              <p className="file-date">
                Last Modified:{" "}
                {new Date(file.lastModified).toLocaleDateString()}
              </p>
            </div>

            {isUploading && (
              <div className="upload-progress-container">
                <div className="upload-progress-label">
                  Uploading: {uploadProgress}%
                </div>
                <div className="upload-progress-bar">
                  <div
                    className="upload-progress-fill"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <button
                  className="cancel-button"
                  onClick={handleCancel}
                  aria-label="Cancel upload"
                >
                  Cancel
                </button>
              </div>
            )}

            {uploadError && (
              <div className="upload-error" role="alert">
                <p>{uploadError}</p>
                <button className="retry-button" onClick={handleRetry}>
                  Retry Upload
                </button>
              </div>
            )}

            {uploadSuccess && (
              <div className="upload-success" role="status">
                <p>File uploaded successfully!</p>
              </div>
            )}

            <div className="file-actions">
              {!isUploading && !uploadSuccess && (
                <button
                  className="upload-button"
                  onClick={handleUpload}
                  disabled={isUploading}
                  aria-label="Upload file"
                >
                  Upload File
                </button>
              )}

              <button
                className="clear-button"
                onClick={handleClear}
                disabled={isUploading}
                aria-label="Clear selection"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUploader;
