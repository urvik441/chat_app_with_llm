import React, { useState, useRef, useEffect } from 'react';
import { Send, Menu, Plus, MessageSquare, Sparkles, User, Bot, Edit2, Trash2, Check, X, Paperclip, XCircle, Camera, Video, Square, Aperture } from 'lucide-react';
import './ChatApp.css';

export default function ChatApp() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [conversations, setConversations] = useState([
    { id: 1, title: 'New Conversation', messages: [] }
  ]);
  const [activeConversation, setActiveConversation] = useState(1);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const cameraVideoRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversations]);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      try {
        if (cameraStreamRef.current) {
          cameraStreamRef.current.getTracks().forEach((t) => t.stop());
        }
      } catch {
        // ignore
      }
    };
  }, []);

  const getCurrentConversation = () => {
    return conversations.find(c => c.id === activeConversation);
  };

  const setPreviewFromFile = (file, previewUrl, type, isObjectUrl = false) => {
    setSelectedFile(file);
    setFilePreview({
      url: previewUrl,
      type,
      name: file?.name || 'attachment',
      _isObjectUrl: isObjectUrl,
    });
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check if file is image or video
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        // If we had an objectURL from camera, revoke it before replacing
        if (filePreview?._isObjectUrl && filePreview?.url) {
          try { URL.revokeObjectURL(filePreview.url); } catch { /* ignore */ }
        }
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewFromFile(file, reader.result, file.type.startsWith('image/') ? 'image' : 'video', false);
        };
        reader.readAsDataURL(file);
      } else {
        alert('Please select an image or video file');
      }
    }
  };

  const removeFilePreview = () => {
    if (filePreview?._isObjectUrl && filePreview?.url) {
      try { URL.revokeObjectURL(filePreview.url); } catch { /* ignore */ }
    }
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const stopCameraStream = () => {
    try {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    } finally {
      cameraStreamRef.current = null;
      if (cameraVideoRef.current) {
        cameraVideoRef.current.srcObject = null;
      }
    }
  };

  const openCamera = async () => {
    try {
      setIsCameraOpen(true);

      if (!navigator?.mediaDevices?.getUserMedia) {
        alert('Camera is not supported in this browser.');
        setIsCameraOpen(false);
        return;
      }

      // Note: camera access typically requires HTTPS or localhost.
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: true,
      });

      cameraStreamRef.current = stream;
      if (cameraVideoRef.current) {
        cameraVideoRef.current.srcObject = stream;
        await cameraVideoRef.current.play().catch(() => {});
      }
    } catch (err) {
      console.error('Camera access error:', err);
      alert('Unable to access camera. Please allow camera permission (HTTPS/localhost required).');
      setIsCameraOpen(false);
      stopCameraStream();
    }
  };

  const closeCamera = () => {
    if (isRecording) {
      try {
        mediaRecorderRef.current?.stop();
      } catch {
        // ignore
      }
    }
    setIsRecording(false);
    recordedChunksRef.current = [];
    stopCameraStream();
    setIsCameraOpen(false);
  };

  const takePhotoFromCamera = async () => {
    const videoEl = cameraVideoRef.current;
    if (!videoEl) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoEl.videoWidth || 1280;
    canvas.height = videoEl.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `camera_${Date.now()}.png`, { type: 'image/png' });
      const url = URL.createObjectURL(blob);
      // replace any existing preview
      removeFilePreview();
      setPreviewFromFile(file, url, 'image', true);
      closeCamera();
    }, 'image/png', 0.95);
  };

  const startRecording = () => {
    if (!cameraStreamRef.current) return;
    recordedChunksRef.current = [];

    let mimeType = '';
    if (window.MediaRecorder && MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
      mimeType = 'video/webm;codecs=vp9';
    } else if (window.MediaRecorder && MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
      mimeType = 'video/webm;codecs=vp8';
    } else if (window.MediaRecorder && MediaRecorder.isTypeSupported('video/webm')) {
      mimeType = 'video/webm';
    }

    const recorder = new MediaRecorder(cameraStreamRef.current, mimeType ? { mimeType } : undefined);
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) recordedChunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const chunks = recordedChunksRef.current;
      if (!chunks.length) return;
      const blob = new Blob(chunks, { type: mimeType || 'video/webm' });
      const file = new File([blob], `camera_${Date.now()}.webm`, { type: blob.type });
      const url = URL.createObjectURL(blob);
      // replace any existing preview
      removeFilePreview();
      setPreviewFromFile(file, url, 'video', true);
      recordedChunksRef.current = [];
      closeCamera();
    };

    recorder.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    try {
      mediaRecorderRef.current?.stop();
    } catch (e) {
      console.error('Stop recording error:', e);
      setIsRecording(false);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() && !selectedFile) return;

    const messageText = inputMessage.trim();
    
    const userMessage = {
      id: Date.now(),
      text: messageText,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      file: filePreview ? {
        url: filePreview.url,
        type: filePreview.type,
        name: filePreview.name
      } : null
    };

    setConversations(prev => prev.map(conv => 
      conv.id === activeConversation 
        ? { ...conv, messages: [...conv.messages, userMessage] }
        : conv
    ));

    setInputMessage('');
    removeFilePreview();
    setIsTyping(true);

    try {
      // Only send text message to API (file handling can be added later if API supports it)
      if (messageText) {
        const response = await fetch('http://35.222.160.16:3489/chat', {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message: messageText })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        const aiMessage = {
          id: Date.now() + 1,
          text: data.content || 'No response received',
          sender: 'ai',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setConversations(prev => prev.map(conv => 
          conv.id === activeConversation 
            ? { ...conv, messages: [...conv.messages, aiMessage] }
            : conv
        ));
      } else {
        // If only file sent without text, just stop typing indicator
        setIsTyping(false);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        text: `Sorry, I encountered an error: ${error.message}. Please try again.`,
        sender: 'ai',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setConversations(prev => prev.map(conv => 
        conv.id === activeConversation 
          ? { ...conv, messages: [...conv.messages, errorMessage] }
          : conv
      ));
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const createNewConversation = () => {
    const newConv = {
      id: Date.now(),
      title: `Conversation ${conversations.length + 1}`,
      messages: []
    };
    setConversations([...conversations, newConv]);
    setActiveConversation(newConv.id);
  };

  const startEditing = (id, title) => {
    setEditingId(id);
    setEditingTitle(title);
  };

  const saveEdit = () => {
    if (editingTitle.trim()) {
      setConversations(prev => prev.map(conv => 
        conv.id === editingId 
          ? { ...conv, title: editingTitle.trim() }
          : conv
      ));
    }
    setEditingId(null);
    setEditingTitle('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingTitle('');
  };

  const deleteConversation = (id) => {
    if (conversations.length === 1) {
      alert('You must have at least one conversation!');
      return;
    }
    
    const confirmDelete = window.confirm('Are you sure you want to delete this conversation?');
    if (confirmDelete) {
      setConversations(prev => prev.filter(conv => conv.id !== id));
      
      if (activeConversation === id) {
        const remainingConvs = conversations.filter(conv => conv.id !== id);
        setActiveConversation(remainingConvs[0].id);
      }
    }
  };

  const currentConv = getCurrentConversation();

  return (
    <>
      <div className="chat-app-container">
        {/* Sidebar */}
        <div className={`sidebar-container ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
          <div className="sidebar-header">
            <div className="sidebar-logo">
              <Sparkles className="sidebar-logo-icon" size={28} />
              <h2 className="sidebar-title">AI Chat</h2>
            </div>
            
            <button onClick={createNewConversation} className="new-chat-btn">
              <Plus size={20} />
              <span>New Conversation</span>
            </button>
          </div>
          
          <div className="conversations-list scrollbar-custom">
            {conversations.map(conv => (
              <div 
                key={conv.id} 
                className={`conversation-item-wrapper ${activeConversation === conv.id ? 'active' : ''}`}
              >
                {editingId === conv.id ? (
                  <div className="edit-input-wrapper">
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') saveEdit();
                        if (e.key === 'Escape') cancelEdit();
                      }}
                      className="edit-input"
                      autoFocus
                    />
                    <div className="edit-actions">
                      <button onClick={saveEdit} className="action-btn save">
                        <Check size={16} />
                      </button>
                      <button onClick={cancelEdit} className="action-btn">
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="conversation-item">
                    <div className="conversation-left" onClick={() => setActiveConversation(conv.id)}>
                      <MessageSquare size={18} className="conversation-icon" />
                      <span className="conversation-title">{conv.title}</span>
                    </div>
                    <div className="conversation-actions">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditing(conv.id, conv.title);
                        }} 
                        className="action-btn"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConversation(conv.id);
                        }} 
                        className="action-btn delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="main-chat-area">
          {/* Header */}
          <div className="chat-header">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="menu-toggle-btn">
              <Menu size={24} />
            </button>
            <div className="header-info">
              <div className="header-avatar">
                <Bot size={20} />
              </div>
              <div className="header-text-container">
                <h1 className="header-title">AI Assistant</h1>
                <p className="header-subtitle">Always here to help</p>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="messages-area scrollbar-custom">
            <div className="messages-container">
              <div className="messages-list">
                {currentConv?.messages.length === 0 && (
                  <div className="empty-state">
                    <div className="empty-state-icon-wrapper">
                      <Sparkles className="empty-state-icon" size={32} />
                    </div>
                    <h3 className="empty-state-title">Start a Conversation</h3>
                    <p className="empty-state-text">Ask me anything and I'll help you out!</p>
                  </div>
                )}
                
                {currentConv?.messages.map(message => (
                  <div key={message.id} className={`message-row ${message.sender}`}>
                    {message.sender === 'ai' && (
                      <div className="message-avatar ai">
                        <Bot size={20} />
                      </div>
                    )}
                    
                    <div className={`message-bubble ${message.sender} ${message.file ? 'has-media' : ''}`}>
                      {message.file && (
                        <div className="message-media">
                          {message.file.type === 'image' ? (
                            <img src={message.file.url} alt={message.file.name} className="media-preview" />
                          ) : (
                            <video src={message.file.url} controls className="media-preview">
                              Your browser does not support the video tag.
                            </video>
                          )}
                        </div>
                      )}
                      {message.text && (
                        <p className="message-text">{message.text}</p>
                      )}
                      <p className={`message-timestamp ${message.sender}`}>
                        {message.timestamp}
                      </p>
                    </div>
                    
                    {message.sender === 'user' && (
                      <div className="message-avatar user">
                        <User size={20} />
                      </div>
                    )}
                  </div>
                ))}
                
                {isTyping && (
                  <div className="message-row ai">
                    <div className="message-avatar ai">
                      <Bot size={20} />
                    </div>
                    <div className="message-bubble ai">
                      <div className="typing-indicator">
                        <div className="typing-dot"></div>
                        <div className="typing-dot"></div>
                        <div className="typing-dot"></div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </div>
          </div>

          {/* Input Area */}
          <div className="input-area">
            {isCameraOpen && (
              <div className="camera-modal-overlay" role="dialog" aria-modal="true">
                <div className="camera-modal">
                  <div className="camera-modal-header">
                    <div className="camera-modal-title">
                      <Aperture size={18} />
                      <span>Camera</span>
                    </div>
                    <button className="camera-close-btn" onClick={closeCamera} aria-label="Close camera">
                      <X size={18} />
                    </button>
                  </div>

                  <div className="camera-preview">
                    <video ref={cameraVideoRef} className="camera-video" playsInline muted />
                  </div>

                  <div className="camera-actions">
                    <button className="camera-action-btn" onClick={takePhotoFromCamera} type="button">
                      <Camera size={18} />
                      <span>Photo</span>
                    </button>

                    {!isRecording ? (
                      <button className="camera-action-btn primary" onClick={startRecording} type="button">
                        <Video size={18} />
                        <span>Record</span>
                      </button>
                    ) : (
                      <button className="camera-action-btn danger" onClick={stopRecording} type="button">
                        <Square size={18} />
                        <span>Stop</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {filePreview && (
              <div className="file-preview-container">
                <div className="file-preview">
                  {filePreview.type === 'image' ? (
                    <img src={filePreview.url} alt={filePreview.name} className="preview-image" />
                  ) : (
                    <video src={filePreview.url} className="preview-video" controls />
                  )}
                  <button onClick={removeFilePreview} className="remove-preview-btn">
                    <XCircle size={20} />
                  </button>
                </div>
              </div>
            )}
            <div className="input-container">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*,video/*"
                style={{ display: 'none' }}
                id="file-input"
              />
              <label htmlFor="file-input" className="file-attach-btn">
                <Paperclip size={22} />
              </label>
              <button type="button" className="file-attach-btn camera-btn" onClick={openCamera} aria-label="Open camera">
                <Camera size={22} />
              </button>
              <div className="input-wrapper">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="message-input"
                  rows="1"
                />
              </div>
              <button
                onClick={sendMessage}
                disabled={!inputMessage.trim() && !selectedFile}
                className="send-btn"
              >
                <Send size={22} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}