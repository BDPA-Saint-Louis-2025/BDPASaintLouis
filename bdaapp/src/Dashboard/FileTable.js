import React from 'react';

const FileTable = ({ files }) => {
  if (!files.length) {
    return <p>No files found.</p>;
  }

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <th>Name</th>
          <th>Type</th>
          <th>Size</th>
          <th>Created</th>
          <th>Modified</th>
        </tr>
      </thead>
      <tbody>
        {files.map(file => (
          <tr key={file._id}>
            <td>{file.name}</td>
            <td>{file.type}</td>
            <td>{file.size ?? 0} B</td>
            <td>{new Date(file.createdAt).toLocaleString()}</td>
            <td>{new Date(file.modifiedAt).toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default FileTable;
