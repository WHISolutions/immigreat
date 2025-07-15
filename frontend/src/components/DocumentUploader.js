import React, { useState } from 'react';
import axios from 'axios';

export default function DocumentUploader({ clientId, typeDocument, existingDoc, onUpload, onDelete }) {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState(existingDoc ? 'done' : 'pending');
  const [docInfo, setDocInfo] = useState(existingDoc);

  const handleUpload = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('clientId', clientId);
    formData.append('typeDocument', typeDocument);

    setStatus('uploading');
    try {
      const res = await axios.post('/api/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setDocInfo(res.data.document);
      setStatus('done');
      setFile(null);
      if (onUpload) onUpload(res.data.document);
    } catch (err) {
      setStatus('error');
      alert('Erreur lors du téléversement');
    }
  };

  const handleDelete = async () => {
    if (!docInfo) return;
    await axios.delete(`/api/documents/${docInfo.id}`);
    setDocInfo(null);
    setStatus('pending');
    if (onDelete) onDelete();
  };

  return (
    <div>
      {docInfo ? (
        <>
          <span>{docInfo.nom_fichier}</span>
          <span style={{ color: 'green', marginLeft: 8 }}>✅ Complété</span>
          <button onClick={handleDelete} style={{ marginLeft: 8 }}>🗑️</button>
        </>
      ) : (
        <>
          <input type="file" onChange={e => setFile(e.target.files[0])} />
          <button onClick={handleUpload} disabled={!file}>TÉLÉVERSER</button>
          {status === 'uploading' && <span>Envoi...</span>}
        </>
      )}
    </div>
  );
} 