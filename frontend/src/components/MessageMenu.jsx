import React from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisV, faTrash, faReply } from '@fortawesome/free-solid-svg-icons';
import './MessageMenu.css';

// Accept props for handlers and permission check
const MessageMenu = ({ onReply, onDelete, isMyMessage }) => {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="menu-trigger" aria-label="Message options">
          <FontAwesomeIcon icon={faEllipsisV} />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content className="menu-content" sideOffset={5} align="end">
          
          <DropdownMenu.Item className="menu-item" onClick={onReply}>
            <FontAwesomeIcon icon={faReply} className="menu-icon" /> Reply
          </DropdownMenu.Item>
          
          {/* Only show Delete if it is my message */}
          {isMyMessage && (
            <DropdownMenu.Item className="menu-item delete" onClick={onDelete}>
              <FontAwesomeIcon icon={faTrash} className="menu-icon" /> Delete
            </DropdownMenu.Item>
          )}

          <DropdownMenu.Arrow className="menu-arrow" />
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};

export default MessageMenu;