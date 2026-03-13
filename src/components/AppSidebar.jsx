import {
  BrainCircuit,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Database,
  Edit2,
  FolderKanban,
  Image as ImageIcon,
  LayoutDashboard,
  Menu,
  MessageSquare,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';

function AppSidebar({
  activeProject,
  activeTab,
  filteredChats,
  isSidebarOpen,
  projects,
  searchQuery,
  setActiveChat,
  setActiveProject,
  setActiveTab,
  setSearchQuery,
  toggleSidebar,
  activeChat,
  onCreateProject,
  onCreateChat,
  onDeleteChat,
  onDeleteProject,
  onEditProject,
  onLogout,
}) {
  return (
    <>
      <button
        className="mobile-sidebar-toggle"
        onClick={toggleSidebar}
        aria-label={isSidebarOpen ? 'Cerrar menú' : 'Abrir menú'}
      >
        {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>
      <aside className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="logo">
            <BrainCircuit size={28} color="#3b82f6" />
            <span>AVATIA</span>
          </div>
          <div className="sidebar-header-actions">
            <button className="sidebar-collapse-btn" onClick={toggleSidebar} title={isSidebarOpen ? 'Contraer menú' : 'Expandir menú'}>
              {isSidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
            </button>
            <button className="new-chat-btn" onClick={onCreateChat} title="Nueva Conversación">
              <Plus size={18} />
            </button>
          </div>
        </div>

        <div className="search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Buscar chats..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </div>

        <div className="sidebar-scrollable">
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
                {filteredChats.map((chat) => (
                  <div
                    key={chat.id}
                    className={`chat-pill ${activeChat?.id === chat.id ? 'active' : ''}`}
                    onClick={() => setActiveChat(chat)}
                  >
                    <span>{chat.title}</span>
                    <Trash2 size={12} className="delete-icon" onClick={(event) => onDeleteChat(event, chat.id)} />
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="sidebar-section">
            <div className="section-title">
              <FolderKanban size={14} />
              <span>PROYECTOS</span>
              <Plus size={14} className="add-icon" onClick={onCreateProject} />
            </div>
            <div className="projects-list">
              {projects.map((project) => (
                <div key={project.id} className="project-group">
                  <div
                    className={`project-item ${activeProject?.id === project.id ? 'active' : ''}`}
                    onClick={() => setActiveProject(project)}
                  >
                    <ChevronRight size={14} className={activeProject?.id === project.id ? 'rotate' : ''} />
                    <span className="project-name">{project.name}</span>
                    <div className="project-actions">
                      <Edit2 size={12} onClick={(event) => onEditProject(event, project)} />
                      <Trash2 size={12} onClick={(event) => onDeleteProject(event, project.id)} />
                    </div>
                  </div>
                  {activeProject?.id === project.id && (
                    <div className="project-chats-list">
                      {filteredChats.map((chat) => (
                        <div
                          key={chat.id}
                          className={`chat-pill sub ${activeChat?.id === chat.id ? 'active' : ''}`}
                          onClick={() => setActiveChat(chat)}
                        >
                          <span>{chat.title}</span>
                          <Trash2 size={12} className="delete-icon" onClick={(event) => onDeleteChat(event, chat.id)} />
                        </div>
                      ))}
                      <button className="add-chat-sub" onClick={onCreateChat}>+ Nuevo Chat</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="sidebar-footer">
          <button className={`nav-btn ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => setActiveTab('chat')}>
            <LayoutDashboard size={18} /> <span>Chat</span>
          </button>
          <button className={`nav-btn ${activeTab === 'images' ? 'active' : ''}`} onClick={() => setActiveTab('images')}>
            <ImageIcon size={18} /> <span>Imágenes</span>
          </button>
          <button className={`nav-btn ${activeTab === 'files' ? 'active' : ''}`} onClick={() => setActiveTab('files')}>
            <Database size={18} /> <span>Archivos</span>
          </button>
          <button className={`nav-btn ${activeTab === 'knowledge' ? 'active' : ''}`} onClick={() => setActiveTab('knowledge')}>
            <BookOpen size={18} /> <span>Base</span>
          </button>
          <button className="nav-btn logout-btn" onClick={onLogout}>
            <X size={18} /> <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>
      {isSidebarOpen && <button className="sidebar-backdrop" onClick={toggleSidebar} aria-label="Cerrar menú" />}
    </>
  );
}

export default AppSidebar;
