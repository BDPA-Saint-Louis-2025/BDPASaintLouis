import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const EditorView = () => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const navigate = useNavigate();
  const { fileId } = useParams();

  const [content, setContent] = useState('');
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchFile = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/files/${fileId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setFile(data);
        setContent(data.content || '');
      } catch (err) {
        setStatus('Failed to load file');
        console.error(err);
      }
    };

    fetchFile();
  }, [fileId, token, navigate]);
const handleSave = async () => {
  try {
    const res = await fetch(`http://localhost:5000/api/files/${fileId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ content })
    });

    if (res.ok) {
      setStatus('Saved!');
   
      setTimeout(() => {
        navigate('/explorer');
      }, 500); // You can adjust the delay or remove it if you want instant redirect
    } else {
      setStatus('Save failed');
    }
  } catch (err) {
    console.error(err);
    setStatus('Save failed');
  }
};

  if (!file) return <p>Loading...</p>;

  return (
    <div className="editor-view">
      <h2>{file.name}</h2>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={20}
        style={{ width: '100%', fontFamily: 'monospace' }}
      />
      <br />
      <button onClick={handleSave}>Save</button>
      <p>{status}</p>
    </div>
  );
};

export default EditorView;
