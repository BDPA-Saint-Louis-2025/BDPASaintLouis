import React, { useEffect, useState } from 'react';
import './ExplorerView.css'; // Make sure dark/light styles are applied in this CSS

function PublicExplorerView() {
  const [files, setFiles] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5000/api/files/public')
      .then(res => res.json())
      .then(data => setFiles(data.files || []))
      .catch(() => setFiles([]));
  }, []);

  useEffect(() => {
  const storedTheme = localStorage.getItem('theme') || 'light';
  document.body.classList.toggle('dark', storedTheme === 'dark');
}, []);


  return (
    <div className="content">
      {/* Page Title */}
      <h2 className="section-title" style={{ marginBottom: '16px' }}>
        Public File Viewer
      </h2>

      {/* File List */}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {files.map(file => (
          <li
            key={file._id}
            className="folder-card fade-in"
            style={{
              cursor: 'default',
              flexDirection: 'column',
              alignItems: 'flex-start',
              paddingBottom: '12px',
              paddingTop: '12px',
            }}
          >
            {/* File Name */}
            <div className="file-name">
              {file.name}{' '}
              <span className="file-type">({file.type})</span>
            </div>

            {/* Last Modified */}
            <div className="file-meta">
              Last modified: {new Date(file.modifiedAt).toLocaleString()}
            </div>

            {/* Tags (if present) */}
            {file.tags?.length > 0 && (
              <div className="file-tags">
                Tags: {file.tags.join(', ')}
              </div>
            )}
          </li>
        ))}

        {/* Empty State */}
        {files.length === 0 && (
          <div className="placeholder-space">No public files available.</div>
        )}
      </ul>
    </div>
  );
}

export default PublicExplorerView;
