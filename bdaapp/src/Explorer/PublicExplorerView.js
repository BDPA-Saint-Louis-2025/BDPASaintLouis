import React, { useEffect, useState } from 'react';

function PublicExplorerView() {
  const [files, setFiles] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5000/api/files/public')
      .then(res => res.json())
      .then(data => setFiles(data.files || []))
      .catch(() => setFiles([]));
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>Public File Viewer</h2>
      <ul>
        {files.map(file => (
          <li key={file._id}>
            <strong>{file.name}</strong> ({file.type}) <br />
            <small>{new Date(file.modifiedAt).toLocaleString()}</small>
            {file.tags?.length > 0 && (
              <div style={{ fontSize: '0.85em', color: '#555' }}>
                Tags: {file.tags.join(', ')}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default PublicExplorerView;
