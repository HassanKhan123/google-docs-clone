import React, { useEffect, useRef, useCallback, useState } from 'react';
import Quill from 'quill';
import { io } from 'socket.io-client';

import 'quill/dist/quill.snow.css';

const TOOLBAR_OPTIONS = [
  [
    {
      header: [1, 2, 3, 4, 5, 6, false],
    },
  ],
  [
    {
      font: [],
    },
  ],
  [
    {
      list: 'ordered',
    },
    {
      list: 'bullet',
    },
  ],
  ['bold', 'italic', 'underline'],
  [{ color: [] }, { background: [] }],
  [{ script: 'sub' }, { script: 'super' }],
  [{ align: [] }],
  ['image', 'blockquote', 'code-block'],
  ['clean'],
];

function TextEditor() {
  const [socket, setSocket] = useState();
  const [quill, setQuill] = useState();
  useEffect(() => {
    const soc = io('http://localhost:3001');
    setSocket(soc);

    return () => {
      soc.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!socket || !quill) return;
    const handler = (delta, oldData, source) => {
      if (source !== 'user') return;
      socket.emit('send-changes', delta);
    };
    quill.on('text-change', handler);

    return () => {
      socket.off('text-change', handler);
    };
  }, [socket, quill]);

  useEffect(() => {
    if (!socket || !quill) return;
    const handler = (delta) => {
      quill.updateContents(delta);
    };
    socket.on('receive-changes', handler);

    return () => {
      socket.off('receive-changes', handler);
    };
  }, [socket, quill]);

  const wrapperRef = useCallback((wrapper) => {
    if (!wrapper) return;
    wrapper.innerHTML = '';
    const editor = document.createElement('div');
    wrapper.append(editor);
    const q = new Quill(editor, {
      theme: 'snow',
      modules: {
        toolbar: TOOLBAR_OPTIONS,
      },
    });
    setQuill(q);
    //
  }, []);

  return <div className='container' ref={wrapperRef}></div>;
}

export default TextEditor;
