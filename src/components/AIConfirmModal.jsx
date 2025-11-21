import React, { useState } from 'react';

const AIConfirmModal = ({ show, original, improved, onConfirm, onEdit, onCancel }) => {
  const [editedText, setEditedText] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const handleEdit = () => {
    setEditedText(improved || original);
    setIsEditing(true);
  };

  const handleConfirmEdit = () => {
    onConfirm(editedText);
    setIsEditing(false);
    setEditedText('');
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedText('');
    onCancel();
  };

  if (!show) return null;

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Confirm Todo</h5>
            <button type="button" className="btn-close" onClick={handleCancel}></button>
          </div>
          <div className="modal-body">
            {!isEditing ? (
              <>
                <div className="mb-3">
                  <label className="form-label fw-bold">Original Transcription:</label>
                  <p className="text-muted">{original}</p>
                </div>
                {improved && improved !== original && (
                  <div className="mb-3">
                    <label className="form-label fw-bold text-success">AI Improved Version:</label>
                    <p className="text-success">{improved}</p>
                  </div>
                )}
                <div className="alert alert-info" role="alert">
                  Do you want to add this todo?
                </div>
              </>
            ) : (
              <div className="mb-3">
                <label className="form-label fw-bold">Edit Todo:</label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  autoFocus
                />
              </div>
            )}
          </div>
          <div className="modal-footer">
            {!isEditing ? (
              <>
                <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                  Cancel
                </button>
                <button type="button" className="btn btn-warning" onClick={handleEdit}>
                  Edit
                </button>
                <button 
                  type="button" 
                  className="btn btn-success" 
                  onClick={() => onConfirm(improved || original)}
                >
                  Yes, Add It
                </button>
              </>
            ) : (
              <>
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditing(false)}>
                  Back
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={handleConfirmEdit}
                  disabled={!editedText.trim()}
                >
                  Confirm Edit
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIConfirmModal;
