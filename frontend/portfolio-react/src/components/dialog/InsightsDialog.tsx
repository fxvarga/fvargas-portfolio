import React from 'react';
import { Dialog, DialogContent, IconButton } from '@mui/material';
import CustomDialogTitle from '../dialog/CustomDialogTitle';
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
        style={{
          color: '#FF5722',
          padding: '6px',
          border: '1px solid #FF5722',
          backgroundColor: 'transparent'
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