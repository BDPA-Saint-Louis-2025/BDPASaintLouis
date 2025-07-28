import React, { useState } from 'react';
import axios from 'axios';

const CreateFileForm = ({ onCreate }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState('file');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
const handleCreate = async (type) => {
  const name = prompt(`Enter ${type} name:`); // inline prompt
  if (!name) return;

  const body = {
    name,
    type,
    parent: currentFolderId || null
  };


   console.log("Creating with parent:", currentFolderId);
   
  if (type === 'file') {
    body.content = '';
    body.tags = [];
  }

  try {
    const res = await fetch('http://localhost:5000/api/files/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(body)
    });

    if (res.ok) {
      setActiveSection('home'); // or whatever updates your UI
      await fetchFiles(currentFolderId, 'home');
    } else {
      alert('Failed to create file/folder');
    }
  } catch (err) {
    console.error(err);
    alert('Create error');
  }
};

  return (
    <div style={{ marginBottom: '20px' }}>
      <h3>Create New</h3>
      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={e => setName(e.target.value)}
      />
      <select value={type} onChange={e => setType(e.target.value)}>
        <option value="file">File</option>
        <option value="folder">Folder</option>
      </select>
      {type === 'file' && (
        <>
          <textarea
            placeholder="Content"
            value={content}
            onChange={e => setContent(e.target.value)}
          />
          <input
            type="text"
            placeholder="Tags (comma-separated)"
            value={tags}
            onChange={e => setTags(e.target.value)}
          />
        </>
      )}
      <button onClick={handleCreate}>Create</button>
    </div>
  );
};

export default CreateFileForm;
