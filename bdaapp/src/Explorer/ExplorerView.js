import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

function ExplorerView() {
  const [files, setFiles] = useState([]);
  const [folderStack, setFolderStack] = useState([{ id: null, name: 'Home' }]);
  const [newFileName, setNewFileName] = useState('');
  const [newFileType, setNewFileType] = useState('file');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingFile, setEditingFile] = useState(null);
  const [editName, setEditName] = useState('');
  const [editTags, setEditTags] = useState('');
  const [sort, setSort] = useState('name');
  const [order, setOrder] = useState('asc');
  const [folderItemCounts, setFolderItemCounts] = useState({});
  const [tagFilter, setTagFilter] = useState('');
  const [availableTags, setAvailableTags] = useState([]);
  const [total, setTotal] = useState(0);
  const [showShared, setShowShared] = useState(false);
  const [editIsPublic, setEditIsPublic] = useState(false);

  const navigate = useNavigate();

  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const decoded = token ? jwtDecode(token) : {};
  const reqUser = decoded.username;
  const currentFolderId = folderStack[folderStack.length - 1].id;

const fetchFiles = async (folderId = null, shared = false) => {
  const url = shared
    ? `http://localhost:5000/api/files/shared`
    : folderId
      ? `http://localhost:5000/api/files/folder/${folderId}?sort=${sort}&order=${order}`
      : `http://localhost:5000/api/files?sort=${sort}&order=${order}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const data = await res.json();
  if (data && Array.isArray(data.files)) {
    setFiles(data.files);
    setTotal(data.total || data.files.length);
    fetchFolderItemCounts(data.files);
    const allTags = new Set();
    data.files.forEach(f => f.tags?.forEach(tag => allTags.add(tag)));
    setAvailableTags([...allTags].sort());
  } else {
    setFiles([]);
  }
};


  useEffect(() => {
    fetchFiles(currentFolderId);
  }, [currentFolderId, sort, order]);

  const handleCreate = async () => {
    if (!newFileName.trim()) return;

    const res = await fetch('http://localhost:5000/api/files/create', {
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

  const previewFile = async (fileId, fileName) => {
  try {
    const res = await fetch(`http://localhost:5000/api/files/${fileId}/preview`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) throw new Error('Preview failed');
    const data = await res.json();

    alert(`Preview of ${fileName}:\n\n${data.content}`);
   
  } catch (err) {
    console.error(err);
    alert('Preview error');
  }
};


  const handleFileUpload = async (file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('parent', currentFolderId || '');

    try {
      const res = await fetch('http://localhost:5000/api/files/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        alert('Upload successful!');
        fetchFiles(currentFolderId);
      } else {
        alert('Upload failed');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred while uploading.');
    }
  };

  const handleFileDownload = async (fileId, fileName) => {
    try {
      const res = await fetch(`http://localhost:5000/api/files/${fileId}/download`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Download failed');

      const blob = await res.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error(err);
      alert('Download error');
    }
  };

  const fetchFolderItemCounts = async (fileList) => {
    const newCounts = {};
    for (const file of fileList) {
      if (file.type === 'folder') {
        const res = await fetch(`http://localhost:5000/api/files/folder/${file._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        newCounts[file._id] = Array.isArray(data) ? data.length : 0;
      }
    }
    setFolderItemCounts(newCounts);
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

    if (data && Array.isArray(data.files)) {
      setFiles(data.files);
      const allTags = new Set();
      data.files.forEach(f => f.tags?.forEach(tag => allTags.add(tag)));
      setAvailableTags([...allTags].sort());
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
  setEditIsPublic(file.isPublic || false); 
};

  const saveMetadata = async () => {
  const res = await fetch(`http://localhost:5000/api/files/${editingFile}/metadata`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      name: editName,
      tags: editTags.split(',').map(tag => tag.trim()),
      isPublic: editIsPublic,                  // ✅ ADD THIS LINE
      clientId: decoded.clientId               // if using clientId for locking
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

<button onClick={() => {
  const newShowShared = !showShared;
  setShowShared(newShowShared);
  fetchFiles(null, newShowShared);
}}>
  {showShared ? "Back to My Files" : "View Shared Files"}
</button>

      <div>
        <input
          placeholder="Search files..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button onClick={handleSearch}>Search</button>
      </div>

      <div style={{ margin: '10px 0' }}>
        <label>Sort by: </label>
        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="name">Name</option>
          <option value="createdAt">Date Created</option>
          <option value="size">Size</option>
        </select>
        <label style={{ marginLeft: 10 }}>Order: </label>
        <select value={order} onChange={(e) => setOrder(e.target.value)}>
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
      </div>

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

      <div style={{ marginTop: '10px' }}>
        <input type="file" onChange={(e) => handleFileUpload(e.target.files[0])} />
      </div>

      <div style={{ margin: '10px 0' }}>
        <label>Filter by Tag: </label>
        <select value={tagFilter} onChange={(e) => setTagFilter(e.target.value)}>
          <option value="">All</option>
          {availableTags.map((tag, index) => (
            <option key={index} value={tag}>{tag}</option>
          ))}
        </select>
      </div>

      <ul>
        {files
          .filter(file => tagFilter === '' || (file.tags && file.tags.includes(tagFilter)))
          .map(file => {
            const isLockedByAnother = file.lock?.user && file.lock.user !== reqUser;
            return (
              <li key={file._id}>
                <span
                  onClick={() => openEditor(file)}
                  style={{ cursor: 'pointer', marginRight: 10 }}
                >
                  {file.name} ({file.type})
                  {file.lock?.user && (
                    <span style={{ color: 'red', marginLeft: 5 }}>
                      Locked by {file.lock.user} ({file.lock.client})
                    </span>
                  )}
                </span>

                {file.tags?.length > 0 && (
                  <div style={{ fontSize: '0.85em', color: '#555', marginLeft: 15 }}>
                    Tags: {file.tags.join(', ')}
                  </div>
                )}

                <small style={{ marginLeft: 8, color: '#666' }}>
                  {file.type === 'file'
                    ? `${(file.size / 1024).toFixed(1)} KB`
                    : `${folderItemCounts[file._id] ?? '?'} items`}
                  {' | '}
                  {new Date(file.modifiedAt).toLocaleString()}
                </small>

                {editingFile === file._id ? (
                 <>
    <input value={editName} onChange={(e) => setEditName(e.target.value)} />
    <input value={editTags} onChange={(e) => setEditTags(e.target.value)} />

    <label style={{ display: 'block', marginTop: 5 }}>
      <input
        type="checkbox"
        checked={editIsPublic}
        onChange={(e) => setEditIsPublic(e.target.checked)}
      />
      {' '}Publicly visible
    </label>

    <button onClick={saveMetadata}>Save</button>
  </>
                ) : (
                  <>
                    <button
                      onClick={() => startEditMetadata(file)}
                      disabled={isLockedByAnother}
                      style={{ opacity: isLockedByAnother ? 0.5 : 1 }}
                    >
                      Edit Metadata
                    </button>
                    <button
                      onClick={() => handleDelete(file._id)}
                      disabled={isLockedByAnother}
                      style={{ opacity: isLockedByAnother ? 0.5 : 1 }}
                    >
                      Delete
                    </button>
                    {file.type === 'file' && (
                      <button onClick={() => handleFileDownload(file._id, file.name)}>
                        Download
                      </button>

                      
                    )}

                    {file.type === 'file' && (
  <>
    <button onClick={() => handleFileDownload(file._id, file.name)}>Download</button>
    <button onClick={() => previewFile(file._id, file.name)}>Preview</button>
  </>
)}

                  </>
                )}
              </li>
            );
          })}
      </ul>
    </div>
  );
}

export default ExplorerView;
