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
          backgroundColor: '#fff0ff'
        }
      }}
    >
      <DialogTitle style={{ color: '#5f4b8b', fontWeight: 'bold' }}>
        Options for "{file.name}"
      </DialogTitle>

      <DialogContent dividers>
        <Button
          fullWidth
          variant="contained"
          style={{
            backgroundColor: file.isPublic ? '#f8c291' : '#9b5de5',
            color: 'white',
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
              style={{ color: '#4b3869', marginBottom: '6px', fontWeight: 500 }}
            >
              Public Link:
            </Typography>

            <TextField
              fullWidth
              value={publicLink}
              InputProps={{
                readOnly: true,
                style: { fontSize: '14px', color: '#5f4b8b' },
                endAdornment: (
                  <IconButton onClick={() => navigator.clipboard.writeText(publicLink)}>
                    <ContentCopyIcon style={{ color: '#9b5de5' }} />
                  </IconButton>
                )
              }}
              variant="outlined"
              size="small"
              sx={{ backgroundColor: '#fdfaff', borderRadius: 1 }}
            />
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button
          onClick={onClose}
          style={{
            backgroundColor: '#d3bfff',
            color: '#4b3869',
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
