import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

import LockIcon from '@mui/icons-material/Lock';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import FolderIcon from '@mui/icons-material/Folder';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import UploadIcon from '@mui/icons-material/Upload';
import HomeIcon from '@mui/icons-material/Home';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DashboardIcon from '@mui/icons-material/Dashboard';
import IconButton from '@mui/material/IconButton';
import ShareIcon from '@mui/icons-material/Share';
import LinkIcon from '@mui/icons-material/Link';
import CreateIcon from '@mui/icons-material/Create';
import DownloadIcon from '@mui/icons-material/Download';

import FileOptionsModal from './FileOptionsModal';
import myImage from '../LoginScreen/bdpaLogo.png';

import './ExplorerView.css';

// ---------- Auth helpers ----------
const getToken = () =>
  localStorage.getItem('token') || sessionStorage.getItem('token');

const authHeaders = (extra = {}) => {
  const t = getToken();
  return {
    ...extra,
    Authorization: `Bearer ${t || ''}`,
    'x-auth-token': t || '',
  };
};

const authFetch = (url, opts = {}) => {
  const t = getToken();
  if (!t) {
    console.warn('[AUTH] No token; redirecting to login');
    window.location.href = '/login';
    return Promise.reject(new Error('NO_TOKEN'));
  }
  return fetch(url, {
    ...opts,
    headers: { ...(opts.headers || {}), ...authHeaders(opts.headers) },
    // credentials: 'include', // uncomment if using cookie sessions
  });
};
// ----------------------------------

function ExplorerView() {
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [editingTags, setEditingTags] = useState({});
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [currentFolderName, setCurrentFolderName] = useState('My Drive');
  const [activeSection, setActiveSection] = useState('home'); // 'home' | 'shared'

  const [showNewMenu, setShowNewMenu] = useState(false);
  const [newFileType, setNewFileType] = useState('file');
  const fileInputRef = React.useRef(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  const [filterType, setFilterType] = useState('all'); // all | file | folder
  const [sortOrder, setSortOrder] = useState('asc');   // asc | desc
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
  const [selectedFile, setSelectedFile] = useState(null);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUser, setShareUser] = useState('');
  const [accessType, setAccessType] = useState('view');
  const [shareEmail, setShareEmail] = useState('');
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [publicLink, setPublicLink] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [updatedTags, setUpdatedTags] = useState([]);
  const [newFileName, setNewFileName] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortOption, setSortOption] = useState('name');
  const [tagInput, setTagInput] = useState('');
  const [username, setUsername] = useState('');
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [compact, setCompact] = useState(false);

  const { fileId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const mq = () => setCompact(window.innerWidth <= 480);
    mq();
    window.addEventListener('resize', mq);
    return () => window.removeEventListener('resize', mq);
  }, []);

  const topRightBadgeStyle = {
    position: 'fixed',
    top: compact ? 'auto' : '10px',
    bottom: compact ? '10px' : 'auto',
    right: '10px',
    left: 'auto',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    zIndex: 9999,
    padding: compact ? '6px 10px' : undefined,
    borderRadius: compact ? '12px' : undefined,
    background: compact ? 'rgba(0,0,0,0.25)' : undefined
  };

  const imageStyle = { width: '50px', height: '50px', objectFit: 'contain' };

  useEffect(() => {
    const u = localStorage.getItem('username') || sessionStorage.getItem('username');
    if (u) setUsername(u);
  }, []);

  useEffect(() => {
    document.body.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));

  const token = getToken();
  const decoded = token ? jwtDecode(token) : {};
  const myUserId =
    decoded?.id || decoded?._id || decoded?.userId || decoded?.sub || null;
  const myUsername =
    decoded?.username || decoded?.name || decoded?.email?.split('@')[0] || '';

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') || 'light';
    document.body.classList.toggle('dark', storedTheme === 'dark');
  }, []);

  // guard on mount if no token
  useEffect(() => {
    if (!getToken()) navigate('/login');
  }, [navigate]);

  // Debounced search
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearchTerm(searchTerm), 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const openFileOptions = (node) => {
    setSelectedNode(node);
    setShowPrivacyModal(true);
  };

  const handleEditFile = (fileId) => navigate(`/editor/${fileId}`);

  const closePrivacyModal = () => {
    setSelectedNode(null);
    setShowPrivacyModal(false);
  };

  const updateTags = async (fileId) => {
    const newTag = prompt("Enter a new tag:");
    if (!newTag) return;

    try {
      const res = await authFetch(`http://localhost:5000/api/files/${fileId}/tags`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: [newTag] })
      });

      if (!res.ok) throw new Error("Failed to update tags");
      const data = await res.json();
      console.log("Tag added:", data.tags);
      alert("Tag added: " + newTag);
    } catch (err) {
      console.error("[TAG UPDATE ERROR]", err);
      alert("Error updating tags");
    }
  };

  // -------- LOADERS --------
  const fetchFiles = async (folderId, section) => {
    let url = `http://localhost:5000/api/files/myfiles?filter=${filter}&sort=${sortOption}&order=${sortOrder}`;
    if (folderId) {
      url = `http://localhost:5000/api/files/folder/${folderId}?sort=${sortOption}&order=${sortOrder}`;
    }

    try {
      const res = await authFetch(url);
      if (res.ok) {
        const data = await res.json();

        // If we're at ROOT of "My Drive", keep only items I own (avoid shared/public leakage)
        const filtered = !folderId
          ? data.filter(i =>
              `${i.owner}` === `${myUserId}` ||
              `${i.owner?._id}` === `${myUserId}`
            )
          : data;

        const foldersOnly = filtered.filter(item => item.type === 'folder');
        const filesOnly   = filtered.filter(item => item.type === 'file');

        setFolders(foldersOnly);
        setFiles(filesOnly);
        setCurrentFolderName('My Drive');
        fetchFolderItemCounts(foldersOnly);
      } else {
        console.error('Failed to fetch files/folders');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSharedFiles = async () => {
    try {
      const res = await authFetch('http://localhost:5000/api/files/shared');
      const data = await res.json();
      // backend may return [] or { files: [...] }
      const items = Array.isArray(data) ? data : (data.files || []);

      // Keep only truly shared items (not owned by me), if your backend includes owner field
      const onlyShared = items.filter(i =>
        `${i.owner}` !== `${myUserId}` && `${i.owner?._id}` !== `${myUserId}`
      );

      const foldersOnly = onlyShared.filter(i => i.type === 'folder');
      const filesOnly   = onlyShared.filter(i => i.type === 'file');

      setFolders(foldersOnly);
      setFiles(filesOnly);
      setCurrentFolderId(null);
      setCurrentFolderName('Shared with me');
      fetchFolderItemCounts(foldersOnly);
    } catch (err) {
      console.error('[FETCH SHARED ERROR]', err);
    }
  };
  // -------------------------

  const saveFileEdits = async () => {
    try {
      const res = await authFetch(`http://localhost:5000/api/files/${fileId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: fileContent,
          tags: updatedTags,
          name: newFileName
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert('Saved!');
      } else {
        console.error('[SAVE ERROR]', data);
      }
    } catch (err) {
      console.error('[FETCH SAVE ERROR]', err);
    }
  };

  const togglePublicAccess = async (id, makePublic) => {
    try {
      const res = await authFetch(`http://localhost:5000/api/files/${id}/permissions`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublic: makePublic })
      });

      const data = await res.json();
      if (res.ok) {
        if (activeSection === 'shared') {
          await fetchSharedFiles();
        } else {
          await fetchFiles(currentFolderId, activeSection);
        }
        closePrivacyModal();
        if (makePublic && data.publicLinkId) {
          const publicUrl = `http://localhost:5000/api/files/public/${data.publicLinkId}`;
          console.log('Public link:', publicUrl);
        }
      } else {
        console.error('[PERMISSION ERROR]', data);
      }
    } catch (err) {
      console.error('[FETCH PERMISSION ERROR]', err);
    }
  };

  const handleCreate = async (type) => {
    const name = prompt(`Enter ${type} name:`);
    if (!name) return;

    const body = { name, type, parent: currentFolderId || null };
    if (type === 'file') { body.content = ''; body.tags = []; }

    try {
      const res = await authFetch('http://localhost:5000/api/files/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        setActiveSection('home');
        await fetchFiles(currentFolderId, 'home');
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err?.message || 'Failed to create file/folder');
      }
    } catch (err) {
      console.error(err);
      alert('Create error');
    }
  };

  const fetchFolderItemCounts = async (folderList) => {
    const counts = {};
    for (const folder of folderList) {
      try {
        const res = await authFetch(`http://localhost:5000/api/files/folder/${folder._id}`);
        const folderData = await res.json();
        counts[folder._id] = folderData.files ? folderData.files.length : 0;
      } catch {
        counts[folder._id] = 0;
      }
    }
    setFolderItemCounts(counts);
  };

  // Choose loader based on activeSection
  useEffect(() => {
    if (activeSection === 'shared') {
      fetchSharedFiles();
    } else {
      fetchFiles(currentFolderId, activeSection);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection, currentFolderId]);

  const handleFileUpload = async (file) => {
    if (!file) return;

    const t = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!t) { alert('Please log in again.'); return; }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('parent', currentFolderId || '');

    // Try 1: Bearer + x-auth-token
    const try1 = await fetch('http://localhost:5000/api/files/upload', {
      method: 'POST',
      body: formData,
      headers: {
        Authorization: `Bearer ${t}`,
        'x-auth-token': t,
      },
    });

    if (try1.ok) {
      if (activeSection === 'shared') await fetchSharedFiles();
      else await fetchFiles(currentFolderId, activeSection);
      return;
    }
    if (try1.status !== 401) {
      const err = await try1.json().catch(() => ({}));
      alert(err?.message || 'Upload failed');
      return;
    }

    // Try 2: token-only headers
    const try2 = await fetch('http://localhost:5000/api/files/upload', {
      method: 'POST',
      body: formData,
      headers: {
        Authorization: t,
        'auth-token': t,
      },
    });

    if (try2.ok) {
      if (activeSection === 'shared') await fetchSharedFiles();
      else await fetchFiles(currentFolderId, activeSection);
      return;
    }

    const msg1 = await try1.text().catch(() => '');
    const msg2 = await try2.text().catch(() => '');
    console.error('[UPLOAD 401] first:', msg1, ' second:', msg2);
    alert('Upload unauthorized. Check auth header format on the server.');
  };

  const handleCreateFolder = async () => {
    const name = prompt('Enter folder name');
    if (!name) return;

    try {
      const res = await authFetch('http://localhost:5000/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          type: 'folder',
          parent: currentFolderId || null,
          tags: []
        })
      });

      if (res.ok) {
        if (activeSection === 'shared') await fetchSharedFiles();
        else await fetchFiles(currentFolderId, activeSection);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err?.message || 'Failed to create folder');
      }
    } catch (err) {
      console.error('[CREATE FOLDER ERROR]', err);
      alert('Error creating folder');
    }
  };

  const handleDownload = async (fileId) => {
    const t = getToken();
    if (!t) { alert("You're not logged in. Please log in again."); return; }

    try {
      const res = await authFetch(`http://localhost:5000/api/files/download/${fileId}`);
      if (!res.ok) throw new Error('Download failed');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'downloaded_file';
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('[DOWNLOAD ERROR]', err);
      alert('Download failed');
    }
  };

  const shareItem = async (itemId) => {
    try {
      const res = await authFetch(`http://localhost:5000/api/files/${itemId}/permissions`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetEmail: shareEmail, accessType })
      });

      if (res.ok) {
        alert('Item shared successfully');
        setShowShareModal(false);
        setShareEmail('');
      } else {
        const error = await res.json().catch(() => ({}));
        console.error('[SHARE ERROR]', error);
        alert(error.error || error.message || 'Failed to share');
      }
    } catch (err) {
      console.error('[SHARE ERROR]', err);
      alert('Error sharing file/folder');
    }
  };

  const generateShareableLink = async (itemId) => {
    try {
      const res = await authFetch(`http://localhost:5000/api/files/${itemId}/generate-link`, {
        method: 'POST',
      });

      const data = await res.json();
      if (res.ok) {
        setPublicLink(data.link);
        setShowLinkModal(true);
      } else {
        alert(data.error || 'Failed to generate link');
      }
    } catch (err) {
      console.error('[LINK GENERATION ERROR]', err);
      alert('Something went wrong generating the link.');
    }
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;

    try {
      const res = await authFetch(`http://localhost:5000/api/files/${itemId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        if (activeSection === 'shared') await fetchSharedFiles();
        else fetchFiles(currentFolderId, activeSection);
      } else {
        const error = await res.json().catch(() => ({}));
        console.error('[DELETE ERROR]', error);
      }
    } catch (err) {
      console.error('[FETCH DELETE ERROR]', err);
    }
  };

  const previewFile = async (file) => {
    try {
      const res = await authFetch(`http://localhost:5000/api/files/${file._id}/preview`);
      if (!res.ok) throw new Error('Preview failed');
      const data = await res.json();
      alert(`Preview of ${file.name}:\n\n${data.content}`);
    } catch (err) {
      console.error(err);
      alert('Preview error');
    }
  };

  // Filters & sorting
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
      {compact ? (
        <div className="top-badge-container">
          <span>{username || 'User'} is Logged</span>
          <img src={myImage} alt="Top Right Icon" />
        </div>
      ) : (
        <div style={topRightBadgeStyle}>
          <span style={{ fontWeight: 600 }}>{username || 'User'} is Logged</span>
          <img src={myImage} alt="Top Right Icon" style={imageStyle} />
        </div>
      )}

      {/* SIDEBAR */}
      <aside className="sidebar">
        <button className="new-btn" onClick={() => setShowNewMenu((v) => !v)}>
          New
        </button>

        {showNewMenu && (
          <div className="new-menu">
            <div className="new-menu-item">
              <button onClick={() => { setShowNewMenu(false); handleCreate('file'); }}>New File</button>
            </div>
            <div className="new-menu-item">
              <button onClick={() => { setShowNewMenu(false); handleCreate('folder'); }}>New Folder</button>
            </div>
            <div className="new-menu-item">
              <button onClick={() => fileInputRef.current.click()}>
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
                      <div className="folder-name truncate" title={folder.name}>
                        {folder.name}
                      </div>
                    </div>
                    <div className="right">
                      <div className="file-actions">
                        <span className="item-count">{folderItemCounts[folder._id] || 0} items</span>
                        <button onClick={() => openFileOptions(folder)} title="Options">
                          <VisibilityIcon />
                        </button>
                        <button onClick={() => handleDelete(folder._id)} title="Delete">
                          <DeleteIcon />
                        </button>
                        <IconButton onClick={() => { setSelectedNode(folder); setShowShareModal(true);}} title="Share">
                          <ShareIcon />
                        </IconButton>
                        <IconButton onClick={() => generateShareableLink(folder._id)} title="Generate Link">
                          <LinkIcon />
                        </IconButton>
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
                      <div className="folder-name truncate" title={file.name}>
                        {file.name}
                      </div>
                    </div>
                    <div className="right">
                      <div className="file-actions">
                        <button onClick={() => openFileOptions(file)} title="Options">
                          <VisibilityIcon />
                        </button>

                        <CreateIcon
                          onClick={() => handleEditFile(file._id)}
                          style={{ cursor: 'pointer', marginLeft: '8px' }}
                          titleAccess="Edit File"
                        />

                        <button onClick={() => handleDelete(file._id)} title="Delete">
                          <DeleteIcon />
                        </button>

                        <IconButton onClick={() => { setSelectedNode(file); setShowShareModal(true);}} title="Share">
                          <ShareIcon />
                        </IconButton>

                        <DownloadIcon onClick={() => handleDownload(file._id)} />

                        <LocalOfferIcon onClick={() => updateTags(file._id)} />

                        {file.tags && file.tags.length > 0 && (
                          <div className="tag-container">
                            {file.tags.map((tag, index) => (
                              <span className="tag" key={index}>{tag}</span>
                            ))}
                          </div>
                        )}

                        <IconButton onClick={() => generateShareableLink(file._id)} title="Generate Link">
                          <LinkIcon />
                        </IconButton>
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

      {/* PRIVACY MODAL */}
      {showPrivacyModal && selectedNode && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>Edit Access for: {selectedNode.name}</h3>
            <div style={{ marginTop: 10 }}>
              <button
                className={selectedNode.isPublic ? 'active' : ''}
                onClick={() => togglePublicAccess(selectedNode._id, true)}
              >
                Make Public
              </button>
              <button
                className={!selectedNode.isPublic ? 'active' : ''}
                onClick={() => togglePublicAccess(selectedNode._id, false)}
              >
                Make Private
              </button>
            </div>
            <button onClick={closePrivacyModal} style={{ marginTop: 20 }}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* SHARE MODAL */}
      {showShareModal && selectedNode && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Share "{selectedNode.name}"</h3>
            <input
              type="text"
              placeholder="Enter user ID or email"
              value={shareEmail}
              onChange={(e) => setShareEmail(e.target.value.trim().toLowerCase())}
            />
            <select value={accessType} onChange={(e) => setAccessType(e.target.value)}>
              <option value="view">View</option>
              <option value="edit">Edit</option>
            </select>
            <div className="modal-buttons">
              <button onClick={() => shareItem(selectedNode._id)}>Share</button>
              <button onClick={() => setShowShareModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* PUBLIC LINK MODAL */}
      {showLinkModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Public Link</h3>
            <input
              type="text"
              value={publicLink}
              readOnly
              onClick={(e) => e.target.select()}
              style={{ width: '100%' }}
            />
            <div className="modal-buttons">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(publicLink);
                  alert('Link copied!');
                }}
              >
                Copy
              </button>
              <button onClick={() => setShowLinkModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ExplorerView;
