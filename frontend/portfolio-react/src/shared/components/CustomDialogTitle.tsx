import React, { FC } from 'react';
import { DialogTitle, IconButton, styled } from '@mui/material';
import CloseIcon from '@material-ui/icons/Close';

// Define props interface
interface CustomDialogTitleProps {
  id?: string;
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}
// Style the DialogTitle component
const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  position: 'relative',
  padding: theme.spacing(2),
  '& h3': {
    margin: 0,
    paddingRight: theme.spacing(6), // Add padding to make room for the close button
  }
}));
// Style the close button
const CloseButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  right: theme.spacing(1),
  top: theme.spacing(1),
  color: theme.palette.grey[500],
}));

// Create component
const CustomDialogTitle: FC<CustomDialogTitleProps> = ({
  children,
  onClose,
  id,
  className,
  ...other
}): JSX.Element => {

  return (
    <StyledDialogTitle id={id} className={className} {...other}>
      <h3>{children}</h3>
      {onClose && (
        <CloseButton
          aria-label="close"
          onClick={onClose}
        >
          <CloseIcon />
        </CloseButton>
      )}
    </StyledDialogTitle>
  );
};

export default CustomDialogTitle;