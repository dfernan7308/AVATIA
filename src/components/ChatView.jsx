import {
  ChevronDown,
  Database,
  FileText,
  LayoutDashboard,
  Paperclip,
  Send,
  Sparkles,
  X,
} from 'lucide-react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

function ChatView({
  activeChat,
  activeProject,
  attachment,
  input,
  isTyping,
  messages,
  onAttachmentChange,
  onExport,
  onInputChange,
  onKeyDown,
  onRemoveAttachment,
  onSend,
  selectedModel,
  setSelectedModel,
}) {
  const MotionDiv = motion.div;

  return (
    <MotionDiv key="chat" className="chat-interface" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <header className="chat-header glass">
        <div className="chat-title">
          <h2>{activeChat?.title || 'Nueva Conversación'}</h2>
          <span className="project-badge">{activeProject ? `Proyecto: ${activeProject.name}` : 'Independiente'}</span>
        </div>

        <div className="model-dropdown-container">
          <select
            value={selectedModel}
            onChange={(event) => setSelectedModel(event.target.value)}
            className="model-select-ui"
          >
            <option value="openai-v5">OpenAI GPT-5.2 (Pro)</option>
            <option value="openai-v4">OpenAI GPT-4o</option>
            <option value="gemini">Gemini 2.5 Flash (Ultra Fast)</option>
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
        {messages.map((message, index) => (
          <div key={`${message.role}-${index}-${message.created_at || 'local'}`} className={`msg-row ${message.role}`}>
            <div className="msg-bubble glass">
              {message.attachment_url && (
                <div className="msg-file">
                  <img src={message.attachment_url} alt="Adjunto" />
                  <div className="file-info">{message.attachment_name}</div>
                </div>
              )}
              <ReactMarkdown>{message.content}</ReactMarkdown>

              {message.role === 'assistant' && (
                <div className="export-options">
                  <button onClick={() => onExport('pdf', message.content, activeChat?.title)} title="Exportar como PDF"><FileText size={12} /> PDF</button>
                  <button onClick={() => onExport('xlsx', message.content, activeChat?.title)} title="Exportar como Excel"><Database size={12} /> Excel</button>
                  <button onClick={() => onExport('docx', message.content, activeChat?.title)} title="Exportar como Word"><FileText size={12} /> Word</button>
                  <button onClick={() => onExport('ppt', message.content, activeChat?.title)} title="Exportar como PPT"><LayoutDashboard size={12} /> PPT</button>
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
              <X size={14} onClick={onRemoveAttachment} />
            </div>
          )}
          <div className="input-row">
            <label className="icon-btn" title="Adjuntar Archivo">
              <Paperclip size={20} />
              <input type="file" onChange={onAttachmentChange} className="sr-only" />
            </label>
            <input
              placeholder="Escribe tu mensaje..."
              value={input}
              onChange={(event) => onInputChange(event.target.value)}
              onKeyDown={onKeyDown}
            />
            <button className="send-btn-main" onClick={onSend} disabled={isTyping}>
              <Send size={18} />
            </button>
          </div>
        </div>
      </footer>
    </MotionDiv>
  );
}

export default ChatView;
