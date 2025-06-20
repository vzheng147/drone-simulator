import { useState, useRef } from "react";
import CloseIcon from "@mui/icons-material/Close";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";
import { type Mosaic } from "../context/MosaicContext";
import "./UploadModal.css";

type UploadModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (mosaic: Omit<Mosaic, "imageURL">, file: File) => void;
};

function UploadModal({ isOpen, onClose, onSubmit }: UploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [mosaicName, setMosaicName] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");

  const getTodayDate = (): string => {
    const today = new Date();
    return today.toISOString().slice(0, 16); // Format for datetime-local input
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));

      // Set filename as default name (without extension)
      const fileName = file.name.replace(/\.[^/.]+$/, "");
      setMosaicName(fileName);
    }
  };

  const handleSubmit = () => {
    if (selectedFile && mosaicName && location && date) {
      const mosaicData = {
        name: mosaicName,
        date: new Date(date),
        location: location,
      };

      onSubmit(mosaicData, selectedFile);
      handleClose();
    }
  };

  const handleClose = () => {
    // Reset all state
    setSelectedFile(null);
    setPreviewUrl("");
    setMosaicName("");
    setLocation("");
    setDate("");

    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modalOverlay" onClick={handleClose}>
      <div className="modalContent" onClick={(e) => e.stopPropagation()}>
        <div className="modalHeader">
          <h2>Upload New Mosaic</h2>
          <button className="closeButton" onClick={handleClose}>
            <CloseIcon />
          </button>
        </div>

        <div className="modalBody">
          {/* File Upload Button */}
          <div className="uploadSection">
            <button className="uploadButton" onClick={handleFileUpload}>
              <FileUploadOutlinedIcon />
              {selectedFile ? "Change File" : "Choose File"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
            {selectedFile && (
              <span className="fileName">{selectedFile.name}</span>
            )}
          </div>

          {/* Image Preview */}
          {previewUrl && (
            <div className="imagePreview">
              <img src={previewUrl} alt="Preview" />
            </div>
          )}

          {/* Form Fields */}
          <div className="formGroup">
            <label htmlFor="mosaicName">Mosaic Name:</label>
            <input
              id="mosaicName"
              type="text"
              value={mosaicName}
              onChange={(e) => setMosaicName(e.target.value)}
              placeholder={
                selectedFile
                  ? selectedFile.name.replace(/\.[^/.]+$/, "")
                  : "Enter mosaic name"
              }
            />
          </div>

          <div className="formGroup">
            <label htmlFor="location">Location:</label>
            <input
              id="location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter location"
            />
          </div>

          <div className="formGroup">
            <label htmlFor="date">Date & Time:</label>
            <input
              id="date"
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              placeholder={getTodayDate()}
            />
          </div>
        </div>

        <div className="modalFooter">
          <button className="cancelButton" onClick={handleClose}>
            Cancel
          </button>
          <button
            className="submitButton"
            onClick={handleSubmit}
            disabled={!selectedFile || !mosaicName || !location || !date}
          >
            Upload Mosaic
          </button>
        </div>
      </div>
    </div>
  );
}

export default UploadModal;
