import React, { useEffect, useState, useMemo } from 'react';
import { jwtDecode } from 'jwt-decode';

import FolderIcon from '@mui/icons-material/Folder';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import UploadIcon from '@mui/icons-material/Upload';
import HomeIcon from '@mui/icons-material/Home';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DashboardIcon from '@mui/icons-material/Dashboard';

import './ExplorerView.css';

function ExplorerView() {
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [folderItemCounts, setFolderItemCounts] = useState({});
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [currentFolderName, setCurrentFolderName] = useState('My Drive');

  const [activeSection, setActiveSection] = useState('home');
  const [showNewMenu, setShowNewMenu] = useState(false);
  const [newFileType, setNewFileType] = useState('file');
  const fileInputRef = React.useRef(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  const [filterType, setFilterType] = useState('all'); // all | file | folder
  const [sortOrder, setSortOrder] = useState('asc');   // asc | desc

  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const decoded = token ? jwtDecode(token) : {};

  // Debounced search
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearchTerm(searchTerm), 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchFiles = async (folderId = null, section = activeSection) => {
    let url = `http://localhost:5000/api/files`;
    if (section === 'shared') url = `http://localhost:5000/api/files/shared`;
    if (section === 'recent') url = `http://localhost:5000/api/files/recent`;
    if (folderId) url = `http://localhost:5000/api/files/folder/${folderId}`;

    try {
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data && Array.isArray(data.files)) {
        const folderList = data.files.filter((f) => f.type === 'folder');
        setFiles(data.files.filter((f) => f.type === 'file'));
        setFolders(folderList);
        setCurrentFolderName(data.folderName || (folderId ? 'Folder' : 'My Drive'));
        await fetchFolderItemCounts(folderList);
      } else {
        setFiles([]);
        setFolders([]);
      }
    } catch (e) {
      console.error(e);
      setFiles([]);
      setFolders([]);
    }
  };

  const fetchFolderItemCounts = async (folderList) => {
    const counts = {};
    for (const folder of folderList) {
      try {
        const res = await fetch(`http://localhost:5000/api/files/folder/${folder._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const folderData = await res.json();
        counts[folder._id] = folderData.files ? folderData.files.length : 0;
      } catch {
        counts[folder._id] = 0;
      }
    }
    setFolderItemCounts(counts);
  };

  useEffect(() => {
    fetchFiles(currentFolderId, activeSection);
  }, [activeSection, currentFolderId]);

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
        await fetchFiles(currentFolderId, activeSection);
      } else {
        alert('Upload failed');
      }
    } catch (err) {
      console.error(err);
      alert('Upload error');
    }
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/files/${itemId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchFiles(currentFolderId, activeSection);
    } catch (err) {
      console.error(err);
      alert('Delete error');
    }
  };

  const previewFile = async (file) => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/files/${file._id}/preview`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error('Preview failed');
      const data = await res.json();
      alert(`Preview of ${file.name}:\n\n${data.content}`);
    } catch (err) {
      console.error(err);
      alert('Preview error');
    }
  };

  // Apply filters & sorting
  const displayedFolders = useMemo(() => {
    let list = folders;
    if (filterType !== 'file') {
      list = list.filter((folder) =>
        folder.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
    } else {
      return [];
    }

    list.sort((a, b) => sortOrder === 'asc'
      ? a.name.localeCompare(b.name)
      : b.name.localeCompare(a.name)
    );

    return list;
  }, [folders, debouncedSearchTerm, filterType, sortOrder]);

  const displayedFiles = useMemo(() => {
    let list = files;
    if (filterType !== 'folder') {
      list = list.filter((file) =>
        file.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
    } else {
      return [];
    }

    list.sort((a, b) => sortOrder === 'asc'
      ? a.name.localeCompare(b.name)
      : b.name.localeCompare(a.name)
    );

    return list;
  }, [files, debouncedSearchTerm, filterType, sortOrder]);

  const clearSearch = () => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
  };

  return (
    <div className="drive-layout">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <button className="new-btn" onClick={() => setShowNewMenu((v) => !v)}>
          New
        </button>

        {showNewMenu && (
          <div className="new-menu">
            <div className="new-menu-item">
              <button onClick={() => { setShowNewMenu(false); }}>New File</button>
            </div>
            <div className="new-menu-item">
              <button onClick={() => { setShowNewMenu(false); }}>New Folder</button>
            </div>
            <div className="new-menu-item">
              <button onClick={() => { fileInputRef.current?.click(); setShowNewMenu(false); }}>
                <UploadIcon /> Upload File
              </button>
              <input
                ref={fileInputRef}
                type="file"
                style={{ display: 'none' }}
                onChange={(e) => handleFileUpload(e.target.files[0])}
              />
            </div>
          </div>
        )}

        <nav className="nav">
          <button className={activeSection === 'home' ? 'active' : ''} onClick={() => { setCurrentFolderId(null); setActiveSection('home'); }}>
            <HomeIcon /> My Drive
          </button>
          <button className={activeSection === 'recent' ? 'active' : ''} onClick={() => { setCurrentFolderId(null); setActiveSection('recent'); }}>
            <AccessTimeIcon /> Recent
          </button>
          <button className={activeSection === 'shared' ? 'active' : ''} onClick={() => { setCurrentFolderId(null); setActiveSection('shared'); }}>
            <PeopleAltIcon /> Shared with me
          </button>
        </nav>

        {/* Filter Section */}
        <div className="filter-section">
          <h4>Filter By:</h4>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="all">All</option>
            <option value="file">Files</option>
            <option value="folder">Folders</option>
          </select>

          <h4>Sort By Name:</h4>
          <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
            <option value="asc">Ascending (A-Z)</option>
            <option value="desc">Descending (Z-A)</option>
          </select>
        </div>

        {/* Dashboard Link at bottom */}
        <div className="sidebar-footer">
          <button onClick={() => window.location.href = '/dashboard'}>
            <DashboardIcon /> Dashboard
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="content">
        <div className="breadcrumb">
          {currentFolderId && (
            <button className="back-btn" onClick={() => setCurrentFolderId(null)}>
              <ArrowBackIcon /> Back
            </button>
          )}
          <h2>{currentFolderName}</h2>
        </div>

        {/* SEARCH */}
        <div className="search-bar">
          <SearchIcon style={{ color: '#5f4b8b' }} />
          <input
            placeholder="Search files and folders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="clear-search-btn" onClick={clearSearch}>
              <ClearIcon />
            </button>
          )}
        </div>

        {/* FOLDERS */}
        {filterType !== 'file' && (
          <>
            <h3 className="section-title">Folders</h3>
            <div className="folder-row">
              {displayedFolders.length > 0 ? (
                displayedFolders.map((folder) => (
                  <div
                    key={folder._id}
                    className="folder-card fade-in"
                    onDoubleClick={() => setCurrentFolderId(folder._id)}
                  >
                    <div className="left">
                      <FolderIcon style={{ fontSize: 28, color: '#c084fc' }} />
                      <div className="folder-name">{folder.name}</div>
                    </div>
                    <div className="right">
                      <div className="file-actions">
                        <span className="item-count">{folderItemCounts[folder._id] || 0} items</span>
                        <button onClick={() => setCurrentFolderId(folder._id)} title="View">
                          <VisibilityIcon />
                        </button>
                        <button onClick={() => handleDelete(folder._id)} title="Delete">
                          <DeleteIcon />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="placeholder-space">No matching folders.</div>
              )}
            </div>
          </>
        )}

        {/* FILES */}
        {filterType !== 'folder' && (
          <>
            <h3 className="section-title">Files</h3>
            <div className="folder-row">
              {displayedFiles.length > 0 ? (
                displayedFiles.map((file) => (
                  <div
                    key={file._id}
                    className="folder-card fade-in"
                    onDoubleClick={() => previewFile(file)}
                  >
                    <div className="left">
                      <InsertDriveFileIcon style={{ fontSize: 28, color: '#9b5de5' }} />
                      <div className="folder-name">{file.name}</div>
                    </div>
                    <div className="right">
                      <div className="file-actions">
                        <button onClick={() => previewFile(file)} title="View">
                          <VisibilityIcon />
                        </button>
                        <button onClick={() => handleDelete(file._id)} title="Delete">
                          <DeleteIcon />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="placeholder-space">No matching files.</div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default ExplorerView;
