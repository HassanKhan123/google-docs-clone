import React, { useEffect, useRef, useCallback, useState } from 'react';
import Quill from 'quill';
import { io } from 'socket.io-client';
import { useParams } from 'react-router-dom';

import 'quill/dist/quill.snow.css';

const SAVE_INTERVAL_MS = 2000;
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
  const { id: documentId } = useParams();
  const [socket, setSocket] = useState();
  const [quill, setQuill] = useState();
  console.log(documentId);
  useEffect(() => {
    const soc = io('http://localhost:3001');
    setSocket(soc);

    return () => {
      soc.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!socket || !quill) return;
    socket.once('load-document', (document) => {
      quill.setContents(document);
      quill.enable();
    });
    socket.emit('get-document', documentId);
  }, [socket, quill, documentId]);

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

  useEffect(() => {
    if (!socket || !quill) return;

    const interval = setInterval(() => {
      socket.emit('save-document', quill.getContents());
    }, SAVE_INTERVAL_MS);

    return () => {
      clearInterval(interval);
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
    q.disable();
    q.setText('Loading...');
    setQuill(q);
    //
  }, []);

  return <div className='container' ref={wrapperRef}></div>;
}

export default TextEditor;
