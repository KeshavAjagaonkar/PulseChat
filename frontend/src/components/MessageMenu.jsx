import React from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisV, faTrash, faReply } from '@fortawesome/free-solid-svg-icons';
import './MessageMenu.css';

const MessageMenu = () => {
  return (
    <DropdownMenu.Root>
      
      {/* TRIGGER: Renamed class to prevent conflicts */}
      <DropdownMenu.Trigger asChild>
        <button className="menu-trigger" aria-label="Message options">
          <FontAwesomeIcon icon={faEllipsisV} />
        </button>
      </DropdownMenu.Trigger>

      {/* CONTENT: The Glass Popover */}
      <DropdownMenu.Portal>
        <DropdownMenu.Content className="menu-content" sideOffset={5} align="end">
          
          <DropdownMenu.Item className="menu-item">
            <FontAwesomeIcon icon={faReply} className="menu-icon" /> Reply
          </DropdownMenu.Item>
          
          <DropdownMenu.Item className="menu-item delete">
            <FontAwesomeIcon icon={faTrash} className="menu-icon" /> Delete
          </DropdownMenu.Item>

          <DropdownMenu.Arrow className="menu-arrow" />
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};

export default MessageMenu;