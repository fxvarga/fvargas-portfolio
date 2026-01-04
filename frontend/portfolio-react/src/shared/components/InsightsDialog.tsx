import React from 'react';
import { Dialog, DialogContent, IconButton } from '@mui/material';
import CustomDialogTitle from './CustomDialogTitle';
import { useState } from 'react';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';



interface CustomDialogProps {
  title: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
  fullWidth?: boolean;
  className?: string;
  callback?: () => void;
  onCloseCallBack?: () => void;
}



const CustomDialog: React.FC<CustomDialogProps> = ({
  title,
  children,
  maxWidth = 'sm',
  fullWidth = false,
  className = '',
  callback = () => { },
  onCloseCallBack = () => { },
}) => {
  const [open, setOpen] = useState(false);
  const handleClickOpen = () => {
    callback();
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
    onCloseCallBack();
  };
  return (
    <>
      <IconButton
        onClick={handleClickOpen}
        className="insights-trigger-btn"
        style={{
          color: '#FF5722',
          padding: '8px',
          border: '1px solid rgba(255, 87, 34, 0.5)',
          backgroundColor: 'rgba(255, 87, 34, 0.1)',
          backdropFilter: 'blur(4px)',
          boxShadow: '0 0 15px rgba(255, 87, 34, 0.2)',
          transition: 'all 0.3s ease',
        }}
        sx={{
          '&:hover': {
             backgroundColor: 'rgba(255, 87, 34, 0.2) !important',
             transform: 'scale(1.1)',
             boxShadow: '0 0 20px rgba(255, 87, 34, 0.4) !important',
             border: '1px solid #FF5722 !important'
          }
        }}
      >
        <AutoFixHighIcon fontSize="small" />
      </IconButton>
      <Dialog
        onClose={handleClose}
        aria-labelledby="customized-dialog-title"
        open={open}
        maxWidth={maxWidth}
        fullWidth={fullWidth}
      >
        <CustomDialogTitle id="customized-dialog-title" onClose={handleClose}>
          {title}
        </CustomDialogTitle>
        <DialogContent  >
          {children}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CustomDialog;
