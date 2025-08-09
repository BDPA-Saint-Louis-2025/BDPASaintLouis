import React, { useEffect, useState } from 'react';
import './ExplorerView.css'; // keep if you still want .fade-in or other globals

function PublicExplorerView() {
  const [files, setFiles] = useState([]);
  const [isDark, setIsDark] = useState(false);
  const [hovered, setHovered] = useState(null);

  // Load files
  useEffect(() => {
    fetch('http://localhost:5000/api/files/public')
      .then(res => res.json())
      .then(data => setFiles(data.files || []))
      .catch(() => setFiles([]));
  }, []);

  // Sync dark mode from localStorage, apply to <body>, and set full-page bg
  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') || 'light';
    const dark = storedTheme === 'dark';
    setIsDark(dark);
    document.body.classList.toggle('dark', dark);
    // Force full-page background color
    document.body.style.backgroundColor = dark ? '#000000' : '#ffffff';
    document.documentElement.style.backgroundColor = dark ? '#000000' : '#ffffff';
    return () => {
      // optional cleanup if this component unmounts
      document.body.style.backgroundColor = '';
      document.documentElement.style.backgroundColor = '';
    };
  }, []);

  // React to theme changes from elsewhere (another tab/page)
  useEffect(() => {
    const onStorage = e => {
      if (e.key === 'theme') {
        const dark = (e.newValue || 'light') === 'dark';
        setIsDark(dark);
        document.body.classList.toggle('dark', dark);
        document.body.style.backgroundColor = dark ? '#000000' : '#ffffff';
        document.documentElement.style.backgroundColor = dark ? '#000000' : '#ffffff';
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Theme palette (pink accent in dark, purple in light)
  const palette = isDark
    ? {
        pageBg: '#000000',
        cardBg: '#0f0f12',
        text: '#ffffff',
        muted: '#b7b7b7',
        tagText: '#f2f2f2',
        tagBg: 'rgba(255, 105, 180, 0.18)', // hotpink tint
        borderAccent: '#ff69b4', // pink border in dark mode
        shadow: 'rgba(255, 105, 180, 0.25)',
      }
    : {
        pageBg: '#ffffff',
        cardBg: '#ffffff',
        text: '#333333',
        muted: '#666666',
        tagText: '#4a4a4a',
        tagBg: 'rgba(155, 93, 229, 0.12)', // purple tint
        borderAccent: '#9b5de5', // purple border in light mode
        shadow: 'rgba(0, 0, 0, 0.08)',
      };

  // Inline styles
  const styles = {
    page: {
      minHeight: '100vh',
      backgroundColor: palette.pageBg, // guarantees full page black in dark
      color: palette.text,
      padding: '20px',
      boxSizing: 'border-box',
    },
    title: {
      fontSize: '1.6rem',
      fontWeight: 700,
      marginBottom: 20,
      color: palette.text,
    },
    // Responsive grid using CSS Grid; no media queries needed
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
      gap: '18px',
      alignItems: 'stretch',
    },
    card: (isHovered) => ({
      background: palette.cardBg,
      border: `2px solid ${palette.borderAccent}`,     // colored borders
      borderRadius: 12,
      padding: 16,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      boxShadow: isHovered ? `0 8px 22px ${palette.shadow}` : 'none',
      transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
      transition: 'transform 0.18s ease, box-shadow 0.18s ease',
    }),
    fileName: {
      fontWeight: 700,
      fontSize: '1.05rem',
      marginBottom: 6,
      color: palette.text,
      wordBreak: 'break-word',
    },
    fileType: {
      fontSize: '0.95rem',
      fontWeight: 400,
      color: palette.muted,
      marginLeft: 6,
    },
    meta: {
      fontSize: '0.85rem',
      color: palette.muted,
      marginBottom: 8,
    },
    tags: {
      fontSize: '0.85rem',
      color: palette.tagText,
      background: palette.tagBg,
      display: 'inline-block',
      padding: '6px 10px',
      borderRadius: 999,
      marginTop: 'auto', // pushes tags to bottom if card grows
      alignSelf: 'flex-start',
    },
    empty: {
      textAlign: 'center',
      fontSize: '1rem',
      padding: 30,
      color: palette.muted,
      gridColumn: '1 / -1', // full width in the grid
    },
  };

  return (
    <div className="content" style={styles.page}>
      {/* Page Title */}
      <h2 className="section-title" style={styles.title}>
        Public File Viewer
      </h2>

      {/* Responsive Grid of Cards */}
      <div style={styles.grid}>
        {files.map((file) => {
          const isHover = hovered === file._id;
          return (
            <div
              key={file._id}
              className="fade-in"
              style={styles.card(isHover)}
              onMouseEnter={() => setHovered(file._id)}
              onMouseLeave={() => setHovered(null)}
            >
              <div style={styles.fileName}>
                {file.name}
                <span style={styles.fileType}>({file.type})</span>
              </div>

              <div style={styles.meta}>
                Last modified: {new Date(file.modifiedAt).toLocaleString()}
              </div>

              {file.tags?.length > 0 && (
                <div style={styles.tags}>Tags: {file.tags.join(', ')}</div>
              )}
            </div>
          );
        })}

        {files.length === 0 && (
          <div style={styles.empty}>No public files available.</div>
        )}
      </div>
    </div>
  );
}

export default PublicExplorerView;
