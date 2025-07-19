// src/Editor/EditorView.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function EditorView() {
  const { fileId } = useParams();
  const [file, setFile] = useState(null);
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [lockedByMe, setLockedByMe] = useState(false);
  const navigate = useNavigate();

  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const username = localStorage.getItem('username') || sessionStorage.getItem('username');

  // Fetch the file and lock it
  useEffect(() => {
    const fetchAndLock = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/files/${fileId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          setError("Failed to fetch file.");
          return;
        }

        const data = await res.json();
        setFile(data);
        setContent(data.content);

        // Try to acquire the lock
        const lockRes = await fetch(`http://localhost:5000/api/files/${fileId}/lock`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ client: 'editor-view' }),
        });

        if (lockRes.ok) {
          setLockedByMe(true);
        } else {
          const msg = await lockRes.json();
          setError(msg.message || 'File is locked by another user.');
        }
      } catch (err) {
        setError('Network error while fetching the file.');
      }
    };

    fetchAndLock();

    // Unlock the file on unmount
    return () => {
      fetch(`http://localhost:5000/api/files/${fileId}/unlock`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ client: 'editor-view' }),
      });
    };
  }, [fileId, token]);

  const handleSave = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/files/${fileId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content }),
      });

      if (res.ok) {
        alert('Saved!');
      } else {
        const msg = await res.json();
        setError(msg.message || 'Failed to save file.');
      }
    } catch (err) {
      setError('Network error while saving.');
    }
  };

  if (error) return <div style={{ padding: '20px' }}>Error: {error}</div>;
  if (!file) return <div style={{ padding: '20px' }}>Loading...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h2>{file.name}</h2>
      {lockedByMe ? (
        <>
          <textarea
            rows="20"
            cols="80"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <br />
          <button onClick={handleSave}>Save</button>
        </>
      ) : (
        <p>This file is currently locked by another session.</p>
      )}
      <br />
      <button onClick={() => navigate('/explorer')}>Back to Explorer</button>
    </div>
  );
}

export default EditorView;
