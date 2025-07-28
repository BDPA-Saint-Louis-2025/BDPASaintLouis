import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Typography, IconButton, Box
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
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Options for "{file.name}"</DialogTitle>
      <DialogContent dividers>
        <Button
          fullWidth
          variant="contained"
          color={file.isPublic ? "warning" : "primary"}
          onClick={handleTogglePrivacy}
        >
          {file.isPublic ? "Make Private" : "Make Public"}
        </Button>

        {file.isPublic && (
          <Box mt={3}>
            <Typography variant="body2" gutterBottom>
              Public Link:
            </Typography>
            <TextField
              fullWidth
              value={publicLink}
              InputProps={{
                endAdornment: (
                  <IconButton onClick={() => navigator.clipboard.writeText(publicLink)}>
                    <ContentCopyIcon />
                  </IconButton>
                )
              }}
            />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default FileOptionsModal;
