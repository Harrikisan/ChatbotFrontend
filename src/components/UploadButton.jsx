// javascript
import React, { useRef, useState, useCallback } from "react";
import PropTypes from "prop-types";

function humanFileSize(bytes) {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
}

function matchesAccept(file, accept) {
  if (!accept) return true;
  const acceptList = accept.split(",").map((s) => s.trim()).filter(Boolean);
  const { type, name } = file;
  for (const a of acceptList) {
    if (a.startsWith(".")) {
      if (name.toLowerCase().endsWith(a.toLowerCase())) return true;
    } else if (a.endsWith("/*")) {
      const prefix = a.replace("/*", "");
      if (type.startsWith(prefix)) return true;
    } else if (type === a) {
      return true;
    }
  }
  return false;
}

function UploadButton({
  onUpload,
  multiple = false,
  accept = "",
  maxSize = Infinity,
  className = "",
  buttonLabel = "Choose file(s)",
  dropzoneLabel = "Drag & drop files here, or click to select",
  showPreviews = true,
  disabled = false,
}) {
  const inputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [selected, setSelected] = useState([]); // [{ file, previewUrl }]
  const [errors, setErrors] = useState([]);

  const clearSelection = useCallback(() => {
    // revoke object URLs
    selected.forEach((s) => {
      if (s.previewUrl) URL.revokeObjectURL(s.previewUrl);
    });
    setSelected([]);
    setErrors([]);
    if (inputRef.current) inputRef.current.value = "";
  }, [selected]);

  const handleFiles = useCallback(
    (fileList) => {
      if (!fileList || fileList.length === 0) return;
      const filesArray = Array.from(fileList);
      const validFiles = [];
      const errs = [];

      filesArray.forEach((file) => {
        if (!matchesAccept(file, accept)) {
          errs.push(`${file.name}: unsupported file type`);
          return;
        }
        if (file.size > maxSize) {
          errs.push(`${file.name}: too large (${humanFileSize(file.size)} > ${humanFileSize(maxSize)})`);
          return;
        }
        validFiles.push(file);
      });

      setErrors(errs);

      const previewItems = validFiles.map((f) => {
        let previewUrl = null;
        if (showPreviews && f.type.startsWith("image/")) {
          previewUrl = URL.createObjectURL(f);
        }
        return { file: f, previewUrl };
      });

      // If not multiple, only keep first valid file
      const finalSelection = multiple ? previewItems : previewItems.slice(0, 1);
      // Revoke previous preview URLs and set new selection
      selected.forEach((s) => {
        if (s.previewUrl) URL.revokeObjectURL(s.previewUrl);
      });
      setSelected(finalSelection);

      // Invoke callback
      if (validFiles.length > 0) {
        if (multiple) {
          onUpload && onUpload(validFiles);
        } else {
          onUpload && onUpload(validFiles[0]);
        }
      }
    },
    [accept, maxSize, multiple, onUpload, selected, showPreviews]
  );

  const onInputChange = (e) => {
    handleFiles(e.target.files);
  };

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (disabled) return;
    handleFiles(e.dataTransfer.files);
  };

  const onDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    setDragActive(true);
  };

  const onDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const openFilePicker = () => {
    if (disabled) return;
    inputRef.current?.click();
  };

  return (
    <div className={`upload-btn ${className}`}>
      <input
        ref={inputRef}
        type="file"
        style={{ display: "none" }}
        onChange={onInputChange}
        multiple={multiple}
        accept={accept}
        disabled={disabled}
        aria-hidden="true"
      />

      <div
        className={`upload-dropzone ${dragActive ? "drag-active" : ""} ${disabled ? "disabled" : ""}`}
        onClick={openFilePicker}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragEnter={onDragOver}
        onDragLeave={onDragLeave}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openFilePicker();
          }
        }}
        aria-disabled={disabled}
        aria-label={dropzoneLabel}
      >
        <div className="dropzone-content">
          <span>{dropzoneLabel}</span>
          <button
            type="button"
            className="select-files-button"
            onClick={(e) => {
              e.stopPropagation();
              openFilePicker();
            }}
            disabled={disabled}
          >
            {buttonLabel}
          </button>
        </div>
      </div>

      {selected && selected.length > 0 && (
        <div className="upload-previews" aria-live="polite">
          {selected.map((s, idx) => (
            <div key={`${s.file.name}-${s.file.size}-${idx}`} className="upload-preview-item">
              {s.previewUrl ? (
                <img src={s.previewUrl} alt={s.file.name} style={{ maxWidth: 100, maxHeight: 80 }} />
              ) : (
                <div className="file-meta">
                  <strong>{s.file.name}</strong>
                  <div className="file-size">{humanFileSize(s.file.size)}</div>
                </div>
              )}
            </div>
          ))}
          <div style={{ marginTop: 8 }}>
            <button type="button" onClick={clearSelection} className="clear-selection-btn">
              Clear
            </button>
          </div>
        </div>
      )}

      {errors && errors.length > 0 && (
        <div className="upload-errors" role="alert" aria-live="assertive">
          {errors.map((err, i) => (
            <div key={i} className="upload-error-item">
              {err}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

UploadButton.propTypes = {
  onUpload: PropTypes.func.isRequired,
  multiple: PropTypes.bool,
  accept: PropTypes.string,
  maxSize: PropTypes.number,
  className: PropTypes.string,
  buttonLabel: PropTypes.string,
  dropzoneLabel: PropTypes.string,
  showPreviews: PropTypes.bool,
  disabled: PropTypes.bool,
};

export default React.memo(UploadButton);
