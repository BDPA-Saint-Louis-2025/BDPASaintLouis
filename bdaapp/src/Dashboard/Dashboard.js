import React, { useState, useEffect } from 'react';
import FileTable from './FileTable';

const Dashboard = () => {
  const [files, setFiles] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [content, setContent] = useState('');

  const fetchFiles = async () => {
    const res = await fetch("http://localhost:5000/api/files");
    const data = await res.json();
    setFiles(data);
  };

  const makeFile = async () => {
    if (!name) return;
    await fetch("http://localhost:5000/api/files", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        type: "file",
        content,
        tags: []
      })
    });

    setName('');
    setContent('');
    setShowForm(false);
    fetchFiles();
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  return (
    <div>
      <h2>Files</h2>
      <FileTable files={files} />

      <div>
        {!showForm ? (
          <button onClick={() => setShowForm(true)}>Make a File</button>
        ) : (
          <div style={{ marginTop: "10px" }}>
            <input
              placeholder="File name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <br />
            <textarea
              placeholder="Content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              style={{ width: "100%", height: "100px" }}
            />
            <br />
            <button onClick={makeFile}>Create</button>
            <button onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
