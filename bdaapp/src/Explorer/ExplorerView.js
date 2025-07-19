import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function ExplorerView() {
  const [files, setFiles] = useState([]);
  const [folderStack, setFolderStack] = useState([{ id: null, name: 'Home' }]);
  const [newFileName, setNewFileName] = useState('');
  const [newFileType, setNewFileType] = useState('file');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingFile, setEditingFile] = useState(null);
  const [editName, setEditName] = useState('');
  const [editTags, setEditTags] = useState('');
  const navigate = useNavigate();

  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const currentFolderId = folderStack[folderStack.length - 1].id;

  const fetchFiles = async (folderId = null) => {
    const url = folderId
      ? `http://localhost:5000/api/files/folder/${folderId}`
      : 'http://localhost:5000/api/files';

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (Array.isArray(data)) {
      setFiles(data);
    } else {
      setFiles([]);
      console.error('Expected array but got:', data);
    }
  };

  useEffect(() => {
    fetchFiles(currentFolderId);
  }, [currentFolderId]);

  const handleCreate = async () => {
    if (!newFileName.trim()) return;

    const res = await fetch('http://localhost:5000/api/files', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        name: newFileName,
        type: newFileType,
        parent: currentFolderId || null
      })
    });

    if (res.ok) {
      setNewFileName('');
      fetchFiles(currentFolderId);
    }
  };

  const handleDrill = (file) => {
    if (file.type === 'folder') {
      setFolderStack([...folderStack, { id: file._id, name: file.name }]);
    }
  };

  const handleBackTo = (index) => {
    const newStack = folderStack.slice(0, index + 1);
    setFolderStack(newStack);
  };

  const handleSearch = async () => {
    const res = await fetch(`http://localhost:5000/api/files/search?query=${searchTerm}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (Array.isArray(data)) {
      setFiles(data);
    } else {
      setFiles([]);
    }
  };

  const openEditor = (file) => {
    if (file.type === 'file') {
      navigate(`/editor/${file._id}`);
    } else {
      handleDrill(file);
    }
  };

  const startEditMetadata = (file) => {
    setEditingFile(file._id);
    setEditName(file.name);
    setEditTags(file.tags ? file.tags.join(', ') : '');
  };

  const saveMetadata = async () => {
    const res = await fetch(`http://localhost:5000/api/files/${editingFile}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        name: editName,
        tags: editTags.split(',').map(tag => tag.trim())
      })
    });

    if (res.ok) {
      setEditingFile(null);
      fetchFiles(currentFolderId);
    }
  };

  const handleDelete = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;

    const res = await fetch(`http://localhost:5000/api/files/${fileId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });

    if (res.ok) {
      fetchFiles(currentFolderId);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Explorer</h2>

      {/* Search */}
      <div>
        <input
          placeholder="Search files..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button onClick={handleSearch}>Search</button>
      </div>

      {/* Breadcrumb */}
      <div style={{ margin: '10px 0' }}>
        {folderStack.map((f, i) => (
          <span
            key={i}
            onClick={() => handleBackTo(i)}
            style={{ cursor: 'pointer', textDecoration: 'underline', marginRight: 5 }}
          >
            {f.name} {i < folderStack.length - 1 ? '>' : ''}
          </span>
        ))}
      </div>

      {/* File creation */}
      <div>
        <input
          placeholder="New name"
          value={newFileName}
          onChange={(e) => setNewFileName(e.target.value)}
        />
        <select value={newFileType} onChange={(e) => setNewFileType(e.target.value)}>
          <option value="file">File</option>
          <option value="folder">Folder</option>
        </select>
        <button onClick={handleCreate}>Create</button>
      </div>

      {/* File list */}
      <ul>
        {files.map((file) => (
          <li key={file._id}>
            <span
              onClick={() => openEditor(file)}
              style={{ cursor: 'pointer', marginRight: 10 }}
            >
              {file.name} ({file.type})
            </span>
            {editingFile === file._id ? (
              <>
                <input value={editName} onChange={(e) => setEditName(e.target.value)} />
                <input value={editTags} onChange={(e) => setEditTags(e.target.value)} />
                <button onClick={saveMetadata}>Save</button>
              </>
            ) : (
              <>
                <button onClick={() => startEditMetadata(file)}>Edit Metadata</button>
                <button onClick={() => handleDelete(file._id)}>Delete</button>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ExplorerView;
