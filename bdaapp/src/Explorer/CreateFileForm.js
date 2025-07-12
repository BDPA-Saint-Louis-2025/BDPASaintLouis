import React, { useState } from 'react';
import axios from 'axios';

const CreateFileForm = ({ onCreate }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState('file');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');

  const handleCreate = async () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');

    const newFile = {
      name,
      type,
      content: type === 'file' ? content : undefined,
      tags: type === 'file' ? tags.split(',').map(tag => tag.trim()) : [],
    };

    try {
      const res = await axios.post('http://localhost:5000/api/files/create', newFile, {
        headers: {
          Authorization: token,
        },
      });
      onCreate(res.data); // Callback to refresh file list
      setName('');
      setContent('');
      setTags('');
    } catch (err) {
      alert('Error creating file/folder');
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
