import React, { useEffect, useState } from 'react';
import './ExplorerView.css'; // Reusing shared styles like .content, .folder-card, etc.

function PublicExplorerView() {
  const [files, setFiles] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5000/api/files/public')
      .then(res => res.json())
      .then(data => setFiles(data.files || []))
      .catch(() => setFiles([]));
  }, []);

  return (
    <div className="content">
      {/* Page Title */}
      <h2 style={{ color: '#5f4b8b', marginBottom: '16px' }}>Public File Viewer</h2>

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
              paddingTop: '12px'
            }}
          >
            {/* File Name */}
            <div
              style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: '#4b3869',
                marginBottom: '4px'
              }}
            >
              {file.name}{' '}
              <span style={{ fontSize: '13px', fontWeight: 'normal' }}>
                ({file.type})
              </span>
            </div>

            {/* Last Modified */}
            <div style={{ fontSize: '13px', color: '#7a6499', marginBottom: '4px' }}>
              Last modified: {new Date(file.modifiedAt).toLocaleString()}
            </div>

            {/* Tags (if present) */}
            {file.tags?.length > 0 && (
              <div style={{ fontSize: '13px', color: '#8d77a5' }}>
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
