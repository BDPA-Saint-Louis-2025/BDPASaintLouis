import React from 'react';
import './ExplorerView.css';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  IconButton,
  Box
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

const FileOptionsModal = ({ open, file, onClose, token, onUpdate }) => {
  if (!file) return null;

  const handleTogglePrivacy = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/files/${file._id}/privacy`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isPublic: !file.isPublic })
      });

      if (res.ok) {
        onUpdate(); // refresh files
        onClose();  // close modal
      } else {
        alert('Failed to update privacy.');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating privacy.');
    }
  };

  const publicLink = `http://localhost:5000/public/${file._id}`;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        style: {
          borderRadius: '12px',
          padding: '20px',
          backgroundColor: 'var(--modal-bg)',
          boxShadow: `0 4px 12px var(--modal-shadow)`,
          color: 'var(--text-color)'
        }
      }}
    >
      <DialogTitle style={{ color: 'var(--text-color)', fontWeight: 'bold' }}>
        Options for "{file.name}"
      </DialogTitle>

      <DialogContent dividers>
        <Button
          fullWidth
          variant="contained"
          style={{
            backgroundColor: file.isPublic ? 'var(--danger-color)' : 'var(--primary-color)',
            color: 'var(--button-text)',
            marginBottom: '16px'
          }}
          onClick={handleTogglePrivacy}
        >
          {file.isPublic ? "Make Private" : "Make Public"}
        </Button>

        {file.isPublic && (
          <Box mt={2}>
            <Typography
              variant="body2"
              style={{ color: 'var(--text-color)', marginBottom: '6px', fontWeight: 500 }}
            >
              Public Link:
            </Typography>

            <TextField
              fullWidth
              value={publicLink}
              InputProps={{
                readOnly: true,
                style: {
                  fontSize: '14px',
                  color: 'var(--text-color)',
                  backgroundColor: 'var(--input-bg)',
                  borderRadius: '6px',
                  paddingRight: 0
                },
                endAdornment: (
                  <IconButton onClick={() => navigator.clipboard.writeText(publicLink)}>
                    <ContentCopyIcon style={{ color: 'var(--primary-color)' }} />
                  </IconButton>
                )
              }}
              variant="outlined"
              size="small"
            />
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button
          onClick={onClose}
          style={{
            backgroundColor: 'var(--input-border)',
            color: 'var(--text-color)',
            fontWeight: 500
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FileOptionsModal;
