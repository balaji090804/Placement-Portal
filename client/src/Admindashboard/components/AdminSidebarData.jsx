import React from 'react';
import * as FaIcons from 'react-icons/fa';
import * as AiIcons from 'react-icons/ai';
import * as IoIcons from 'react-icons/io';
import * as RiIcons from 'react-icons/ri';

export const SidebarData = [
  {
    title: 'Dashboard',
    path: '/',
    icon: <AiIcons.AiFillHome />,
  },
  {
    title: 'Placement News',
    path: '/News',
    icon: <IoIcons.IoMdPaper />,
  },
  {
    title: 'Interview Calendar',
    path: '/Calendar',
    icon: <IoIcons.IoIosCalendar />,
  },
  {
    title: 'Career Assistant',
    path: '/Chatbot',
    icon: <IoIcons.IoIosChatbubbles />,
  },
  {
    title: 'Task Manager',
    path: '/Todo',
    icon: <FaIcons.FaTasks />,
  },
  {
    title: 'Career Podcasts',
    path: '/Competee',
    icon: <IoIcons.IoMdMicrophone />,
  }
];
