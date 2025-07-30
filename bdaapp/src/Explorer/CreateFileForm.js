import React, { useState, useEffect } from 'react';
import './CreateFileForm.css';

const CreateFileForm = ({ token, currentFolderId, fetchFiles, setActiveSection }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState('file');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.body.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const handleCreate = async () => {
    if (!name) {
      alert('Please enter a name.');
      return;
    }

    const body = {
      name,
      type,
      parent: currentFolderId || null,
      ...(type === 'file' && {
        content: content,
        tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      })
    };

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
        setActiveSection('home');
        await fetchFiles(currentFolderId, 'home');
        setName('');
        setContent('');
        setTags('');
      } else {
        alert('Failed to create file/folder');
      }
    } catch (err) {
      console.error(err);
      alert('Create error');
    }
  };

  return (
    <div className="create-form">
      <h3>Create New</h3>
      <input
        type="text"
        className="input"
        placeholder="Name"
        value={name}
        onChange={e => setName(e.target.value)}
      />
      <select className="input" value={type} onChange={e => setType(e.target.value)}>
        <option value="file">File</option>
        <option value="folder">Folder</option>
      </select>
      {type === 'file' && (
        <>
          <textarea
            className="textarea"
            placeholder="Content"
            value={content}
            onChange={e => setContent(e.target.value)}
          />
          <input
            className="input"
            type="text"
            placeholder="Tags (comma-separated)"
            value={tags}
            onChange={e => setTags(e.target.value)}
          />
        </>
      )}
      <button className="primary-btn" onClick={handleCreate}>Create</button>
    </div>
  );
};

export default CreateFileForm;
