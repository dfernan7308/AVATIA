import React, { useState, useEffect } from 'react';
import {
  MessageSquare, Database, Trash2, Send, Paperclip, X,
  BrainCircuit, Bot, Sparkles, Plus, Search, FolderKanban,
  ChevronRight, LayoutDashboard, FileText, ChevronDown, Edit2, Download,
  Image as ImageIcon, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { processWithAI, supabase, generateImage, auth } from './lib/services';
import { exportToFile } from './lib/fileGenerator';
import './App.css';

function App() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [activeTab, setActiveTab] = useState('chat'); // 'chat', 'files' o 'images'
  const [selectedModel, setSelectedModel] = useState('openai-v5');
  const [input, setInput] = useState('');

  // Estados de Imagenes
  const [imagePrompt, setImagePrompt] = useState('');
  const [imageRef, setImageRef] = useState(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Estados de Datos
  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null); // null significa "Chats Independientes"

  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // UI States
  const [isTyping, setIsTyping] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const [fileManagementData, setFileManagementData] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Modal State
  const [modal, setModal] = useState({ show: false, type: '', title: '', value: '', onConfirm: null });

  // Gestión de Sesión
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Carga inicial solo si hay sesión
  useEffect(() => {
    if (session) {
      fetchProjects();
      fetchIndependentChats();
    }
  }, [session]);

  const handleAuth = async (e) => {
    e.preventDefault();
    if (isRegistering) {
      const { data, error } = await auth.signUp(loginForm.email, loginForm.password);
      if (error) alert('Error al registrar: ' + error.message);
      else if (data.user && data.session) alert('¡Registro exitoso! Iniciando sesión...');
      else alert('Revisa tu correo para confirmar la cuenta (si es necesario).');
    } else {
      const { error } = await auth.signIn(loginForm.email, loginForm.password);
      if (error) alert('Error de acceso: ' + error.message);
    }
  };

  const handleLogout = async () => {
    await auth.signOut();
    setSession(null);
  };

  // Cargar chats cuando cambia el contexto (Proyecto o Independiente)
  useEffect(() => {
    setActiveTab('chat');
    if (activeProject) {
      fetchChats(activeProject.id);
    } else {
      fetchIndependentChats();
    }
  }, [activeProject]);

  // Cargar mensajes cuando cambia el chat activo
  useEffect(() => {
    if (activeChat) {
      fetchMessages(activeChat.id);
    } else {
      setMessages([]);
    }
  }, [activeChat]);

  // Gestión de archivos
  useEffect(() => {
    if (activeTab === 'files') {
      fetchFilesFromMessages();
    }
  }, [activeTab]);

  const fetchProjects = async () => {
    const { data } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
    if (data) setProjects(data);
  };

  const fetchIndependentChats = async () => {
    const { data } = await supabase.from('chats')
      .select('*')
      .is('project_id', null)
      .order('created_at', { ascending: false });
    if (data) {
      setChats(data);
      if (!activeProject && data.length > 0 && !activeChat) setActiveChat(data[0]);
    }
  };

  const fetchChats = async (projectId) => {
    const { data } = await supabase.from('chats')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    if (data) {
      setChats(data);
      if (data.length > 0) setActiveChat(data[0]);
      else setActiveChat(null);
    }
  };

  const fetchMessages = async (chatId) => {
    const { data } = await supabase.from('messages').select('*').eq('chat_id', chatId).order('created_at', { ascending: true });
    if (data) setMessages(data);
  };

  const fetchFilesFromMessages = async () => {
    const { data } = await supabase.from('messages')
      .select('*')
      .not('attachment_url', 'is', null)
      .order('created_at', { ascending: false });
    if (data) setFileManagementData(data);
  };

  // --- COMPONENTE DE MODAL PERSONALIZADO ---
  const openModal = (type, title, initialValue, onConfirm) => {
    setModal({ show: true, type, title, value: initialValue, onConfirm });
  };

  const closeModal = () => {
    setModal({ ...modal, show: false });
  };

  // --- ACCIONES DE PROYECTOS ---

  const handleCreateProject = () => {
    openModal('input', 'Crear Nuevo Proyecto', '', async (name) => {
      if (!name) return;
      const { data } = await supabase.from('projects').insert([{ name }]).select();
      if (data) {
        setProjects(prev => [data[0], ...prev]);
        setActiveProject(data[0]);
      }
    });
  };

  const handleEditProject = (e, project) => {
    e.stopPropagation();
    openModal('input', 'Renombrar Proyecto', project.name, async (newName) => {
      if (!newName || newName === project.name) return;
      const { error } = await supabase.from('projects').update({ name: newName }).eq('id', project.id);
      if (!error) {
        setProjects(prev => prev.map(p => p.id === project.id ? { ...p, name: newName } : p));
        if (activeProject?.id === project.id) setActiveProject({ ...activeProject, name: newName });
      }
    });
  };

  const handleDeleteProject = (e, projectId) => {
    e.stopPropagation();
    openModal('confirm', 'Eliminar Proyecto', '¿Estás seguro de que quieres borrar este proyecto y todos sus chats?', async () => {
      const { error } = await supabase.from('projects').delete().eq('id', projectId);
      if (!error) {
        setProjects(prev => prev.filter(p => p.id !== projectId));
        if (activeProject?.id === projectId) {
          setActiveProject(null);
          setActiveChat(null);
        }
      }
    });
  };

  // --- ACCIONES DE CHATS ---

  const createNewChat = () => {
    setActiveChat(null);
    setMessages([]);
    setActiveTab('chat');
    setInput('');
  };

  const handleDeleteChat = (e, chatId) => {
    e.stopPropagation();
    openModal('confirm', 'Eliminar Chat', '¿Borrar esta conversación para siempre?', async () => {
      const { error } = await supabase.from('chats').delete().eq('id', chatId);
      if (!error) {
        setChats(prev => prev.filter(c => c.id !== chatId));
        if (activeChat?.id === chatId) setActiveChat(null);
      }
    });
  };

  const deleteMessageFile = async (messageId) => {
    const { error } = await supabase.from('messages').update({ attachment_url: null, attachment_name: null }).eq('id', messageId);
    if (!error) {
      setFileManagementData(prev => prev.filter(m => m.id !== messageId));
    }
  };

  // --- MENSAJERÍA ---

  const handleSend = async () => {
    if (!input.trim() && !attachment) return;

    // Si no hay chat activo, creamos uno rápido
    let currentChat = activeChat;
    if (!currentChat) {
      const title = input.slice(0, 30) || 'Nuevo Chat';
      const { data } = await supabase.from('chats').insert([{
        project_id: activeProject?.id || null,
        title: title
      }]).select();
      if (data) {
        currentChat = data[0];
        setChats(prev => [currentChat, ...prev]);
        setActiveChat(currentChat);
      } else return;
    }

    const userMessage = {
      chat_id: currentChat.id,
      project_id: activeProject?.id || null,
      role: 'user',
      content: input,
      model: selectedModel,
      attachment_url: attachment?.url || null,
      attachment_name: attachment?.name || null
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setAttachment(null);
    setIsTyping(true);

    try {
      await supabase.from('messages').insert([userMessage]);

      const stream = await processWithAI(selectedModel, [...messages, userMessage], attachment);

      let assistantContent = '';
      setMessages(prev => [...prev, { role: 'assistant', content: '', model: selectedModel }]);

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        assistantContent += content;
        setMessages(prev => {
          const last = prev[prev.length - 1];
          return [...prev.slice(0, -1), { ...last, content: assistantContent }];
        });
      }

      await supabase.from('messages').insert([{
        chat_id: currentChat.id,
        project_id: activeProject?.id || null,
        role: 'assistant',
        content: assistantContent,
        model: selectedModel
      }]);

    } catch (error) {
      console.error(error);
      setIsTyping(false);
    } finally {
      setIsTyping(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachment({
          url: reader.result,
          name: file.name,
          type: file.type
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRefImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setImageRef({ name: file.name, url: reader.result, type: file.type });
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateImage = async () => {
    if (!imagePrompt) return alert('Por favor, ingresa una descripción para la imagen.');
    setIsGenerating(true);
    setGeneratedImageUrl(null);
    try {
      const url = await generateImage(imagePrompt, imageRef);
      setGeneratedImageUrl(url);
    } catch (error) {
      console.error(error);
      alert('Error al generar la imagen. Verifica tu API Key.');
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredChats = chats.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()));

  if (authLoading) return <div className="loading-screen"><Loader2 className="animate-spin" /></div>;

  if (!session) {
    return (
      <div className="login-container">
        <motion.div
          className="login-card glass"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="login-header">
            <BrainCircuit size={48} color="#3b82f6" />
            <h1>AVATIA</h1>
            <p>{isRegistering ? 'Crear nueva cuenta' : 'Asistente de Inteligencia Avanzada'}</p>
          </div>
          <form onSubmit={handleAuth} className="login-form">
            <div className="input-group">
              <label>Email</label>
              <input
                type="email"
                placeholder="usuario@correo.com"
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                required
              />
            </div>
            <div className="input-group">
              <label>Contraseña</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  className="show-pass-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
            </div>
            <button type="submit" className="login-btn">
              {isRegistering ? 'Crear Cuenta' : 'Acceder al Sistema'}
            </button>
          </form>
          <div className="login-footer">
            <button className="toggle-auth-btn" onClick={() => setIsRegistering(!isRegistering)}>
              {isRegistering ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate aquí'}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* SIDEBAR */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="logo">
            <BrainCircuit size={28} color="#3b82f6" />
            <span>AVATIA</span>
          </div>
          <button className="new-chat-btn" onClick={createNewChat} title="Nueva Conversación">
            <Plus size={18} />
          </button>
        </div>

        <div className="search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Buscar chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="sidebar-scrollable">
          {/* Seccion Independiente */}
          <section className="sidebar-section">
            <div
              className={`section-header ${!activeProject ? 'active' : ''}`}
              onClick={() => setActiveProject(null)}
            >
              <MessageSquare size={14} />
              <span>CHATS INDEPENDIENTES</span>
            </div>
            {!activeProject && (
              <div className="chats-list">
                {filteredChats.map(c => (
                  <div key={c.id} className={`chat-pill ${activeChat?.id === c.id ? 'active' : ''}`} onClick={() => setActiveChat(c)}>
                    <span>{c.title}</span>
                    <Trash2 size={12} className="delete-icon" onClick={(e) => handleDeleteChat(e, c.id)} />
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Seccion Proyectos */}
          <section className="sidebar-section">
            <div className="section-title">
              <FolderKanban size={14} />
              <span>PROYECTOS</span>
              <Plus size={14} className="add-icon" onClick={handleCreateProject} />
            </div>
            <div className="projects-list">
              {projects.map(p => (
                <div key={p.id} className="project-group">
                  <div
                    className={`project-item ${activeProject?.id === p.id ? 'active' : ''}`}
                    onClick={() => setActiveProject(p)}
                  >
                    <ChevronRight size={14} className={activeProject?.id === p.id ? 'rotate' : ''} />
                    <span className="project-name">{p.name}</span>
                    <div className="project-actions">
                      <Edit2 size={12} onClick={(e) => handleEditProject(e, p)} />
                      <Trash2 size={12} onClick={(e) => handleDeleteProject(e, p.id)} />
                    </div>
                  </div>
                  {activeProject?.id === p.id && (
                    <div className="project-chats-list">
                      {filteredChats.map(c => (
                        <div key={c.id} className={`chat-pill sub ${activeChat?.id === c.id ? 'active' : ''}`} onClick={() => setActiveChat(c)}>
                          <span>{c.title}</span>
                          <Trash2 size={12} className="delete-icon" onClick={(e) => handleDeleteChat(e, c.id)} />
                        </div>
                      ))}
                      <button className="add-chat-sub" onClick={createNewChat}>+ Nuevo Chat</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="sidebar-footer">
          <button className={`nav-btn ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => setActiveTab('chat')}>
            <LayoutDashboard size={18} /> Chat
          </button>
          <button className={`nav-btn ${activeTab === 'images' ? 'active' : ''}`} onClick={() => setActiveTab('images')}>
            <ImageIcon size={18} /> Imágenes
          </button>
          <button className={`nav-btn ${activeTab === 'files' ? 'active' : ''}`} onClick={() => setActiveTab('files')}>
            <Database size={18} /> Archivos
          </button>
          <button className="nav-btn logout-btn" onClick={handleLogout}>
            <X size={18} /> Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="main-content">
        <AnimatePresence mode="wait">
          {activeTab === 'chat' ? (
            <motion.div key="chat" className="chat-interface" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <header className="chat-header glass">
                <div className="chat-title">
                  <h2>{activeChat?.title || 'Nueva Conversación'}</h2>
                  <span className="project-badge">{activeProject ? `Proyecto: ${activeProject.name}` : 'Independiente'}</span>
                </div>

                <div className="model-dropdown-container">
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="model-select-ui"
                  >
                    <option value="openai-v5">OpenAI Version 5.2 (Pro)</option>
                    <option value="openai-v4">OpenAI Version 4 (o)</option>
                    <option value="groq">Groq (Llama 3.3)</option>
                    <option value="cerebras">Cerebras (Llama 3.1)</option>
                  </select>
                  <ChevronDown size={14} className="dropdown-icon" />
                </div>
              </header>

              <div className="chat-messages">
                {messages.length === 0 && (
                  <div className="empty-chat">
                    <Sparkles size={48} color="#3b82f6" />
                    <h1>¿Cómo puedo ayudarte?</h1>
                    <p>{activeProject ? `Trabajando en: ${activeProject.name}` : 'Conversación de AVATIA.'}</p>
                  </div>
                )}
                {messages.map((m, i) => (
                  <div key={i} className={`msg-row ${m.role}`}>
                    <div className="msg-bubble glass">
                      {m.attachment_url && (
                        <div className="msg-file">
                          <img src={m.attachment_url} alt="file" />
                          <div className="file-info">{m.attachment_name}</div>
                        </div>
                      )}
                      <ReactMarkdown>{m.content}</ReactMarkdown>

                      {m.role === 'assistant' && (
                        <div className="export-options">
                          <button onClick={() => exportToFile('pdf', m.content, activeChat?.title)} title="Exportar como PDF"><FileText size={12} /> PDF</button>
                          <button onClick={() => exportToFile('xlsx', m.content, activeChat?.title)} title="Exportar como Excel"><Database size={12} /> Excel</button>
                          <button onClick={() => exportToFile('docx', m.content, activeChat?.title)} title="Exportar como Word"><FileText size={12} /> Word</button>
                          <button onClick={() => exportToFile('ppt', m.content, activeChat?.title)} title="Exportar como PPT"><LayoutDashboard size={12} /> PPT</button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="msg-row assistant">
                    <div className="typing glass">...</div>
                  </div>
                )}
              </div>

              <footer className="chat-footer">
                <div className="input-container glass">
                  {attachment && (
                    <div className="file-preview-strip">
                      <FileText size={14} /> {attachment.name}
                      <X size={14} onClick={() => setAttachment(null)} />
                    </div>
                  )}
                  <div className="input-row">
                    <label className="icon-btn" title="Adjuntar Archivo">
                      <Paperclip size={20} />
                      <input type="file" onChange={handleFileChange} className="sr-only" />
                    </label>
                    <input
                      placeholder="Escribe tu mensaje..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    />
                    <button className="send-btn-main" onClick={handleSend} disabled={isTyping}>
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              </footer>
            </motion.div>
          ) : activeTab === 'images' ? (
            <motion.div key="images" className="images-interface" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="view-header">
                <h1>Generador de Imágenes Artísticas</h1>
                <p>Usa la potencia de AVATIA para crear arte visual único.</p>
              </div>

              <div className="image-gen-container glass">
                <div className="image-display-area">
                  {isGenerating ? (
                    <div className="loader-overlay">
                      <Loader2 size={48} className="animate-spin" />
                      <p>Esculpiendo tu visión...</p>
                    </div>
                  ) : generatedImageUrl ? (
                    <img src={generatedImageUrl} alt="Generated" className="result-img" />
                  ) : (
                    <div className="image-placeholder">
                      <ImageIcon size={64} style={{ opacity: 0.2 }} />
                      <p>Tu creación aparecerá aquí</p>
                    </div>
                  )}
                </div>

                <div className="image-controls">
                  <div className="style-ref-box glass">
                    <label className="ref-upload-btn">
                      <Paperclip size={16} />
                      {imageRef ? 'Estilo Cargado' : 'Subir Imagen de Estilo'}
                      <input type="file" className="sr-only" onChange={handleRefImageChange} accept="image/*" />
                    </label>
                    {imageRef && (
                      <div className="ref-preview-small">
                        <img src={imageRef.url} alt="Style Ref" />
                        <X size={12} className="remove-ref" onClick={() => setImageRef(null)} />
                      </div>
                    )}
                    <p className="ref-hint">AVATIA analizará esta imagen para replicar su estilo artístico.</p>
                  </div>

                  <textarea
                    placeholder="Describe la imagen que tienes en mente con todo detalle..."
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                  />
                  <button className="gen-btn" onClick={handleGenerateImage} disabled={isGenerating}>
                    {isGenerating ? 'Generando...' : 'Generar Obra de Arte'}
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div key="files" className="files-interface" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="view-header">
                <h1>Limpieza de Archivos</h1>
                <p>Gestiona los archivos que has subido. Eliminarlos no borrará el texto de los chats.</p>
              </div>

              <div className="files-grid">
                {fileManagementData.map((m) => (
                  <div key={m.id} className="file-card glass">
                    <div className="file-card-preview">
                      <img src={m.attachment_url} alt="file" />
                    </div>
                    <div className="file-card-info">
                      <strong>{m.attachment_name || 'Imagen sin nombre'}</strong>
                      <span>Chat: {m.chat_id} | {new Date(m.created_at).toLocaleDateString()}</span>
                    </div>
                    <button className="delete-file-btn" onClick={() => deleteMessageFile(m.id)}>
                      <Trash2 size={16} /> Borrar Archivo
                    </button>
                  </div>
                ))}
                {fileManagementData.length === 0 && <div className="empty-files">Sin archivos guardados.</div>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* MODAL PERSONALIZADO */}
      <AnimatePresence>
        {modal.show && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="modal-card glass"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              <h3>{modal.title}</h3>
              {modal.type === 'input' ? (
                <input
                  type="text"
                  value={modal.value}
                  autoFocus
                  onChange={(e) => setModal({ ...modal, value: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      modal.onConfirm(modal.value);
                      closeModal();
                    }
                  }}
                  className="modal-input"
                  placeholder="Escribe aquí..."
                />
              ) : (
                <p>{modal.value}</p>
              )}
              <div className="modal-actions">
                <button className="btn-secondary" onClick={closeModal}>Cancelar</button>
                <button className="btn-primary" onClick={() => {
                  modal.onConfirm(modal.value);
                  closeModal();
                }}>
                  {modal.type === 'input' ? 'Guardar' : 'Confirmar'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
