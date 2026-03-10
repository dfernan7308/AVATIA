import { Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

function FilesView({ fileManagementData, onDeleteFile }) {
  const MotionDiv = motion.div;

  return (
    <MotionDiv key="files" className="files-interface" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="view-header">
        <h1>Limpieza de Archivos</h1>
        <p>Gestiona los archivos que has subido. Eliminarlos no borrará el texto de los chats.</p>
      </div>

      <div className="files-grid">
        {fileManagementData.map((message) => (
          <div key={message.id} className="file-card glass">
            <div className="file-card-preview">
              <img src={message.attachment_url} alt="Adjunto" />
            </div>
            <div className="file-card-info">
              <strong>{message.attachment_name || 'Imagen sin nombre'}</strong>
              <span>Chat: {message.chat_id} | {new Date(message.created_at).toLocaleDateString()}</span>
            </div>
            <button className="delete-file-btn" onClick={() => onDeleteFile(message.id)}>
              <Trash2 size={16} /> Borrar Archivo
            </button>
          </div>
        ))}
        {fileManagementData.length === 0 && <div className="empty-files">Sin archivos guardados.</div>}
      </div>
    </MotionDiv>
  );
}

export default FilesView;
