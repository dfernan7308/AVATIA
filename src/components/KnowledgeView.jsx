import { BookOpen, Plus, Save, Search, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

function KnowledgeView({
  entries,
  filter,
  form,
  isSaving,
  onCreate,
  onDelete,
  onFilterChange,
  onFormChange,
  onSelect,
  onSave,
  selectedEntryId,
}) {
  const MotionDiv = motion.div;

  return (
    <MotionDiv key="knowledge" className="knowledge-interface" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="view-header">
        <h1>Base de Conocimiento</h1>
        <p>Guarda procedimientos, scripts, notas operativas y contexto importante en un solo lugar.</p>
      </div>

      <div className="knowledge-layout">
        <aside className="knowledge-sidebar glass">
          <div className="knowledge-toolbar">
            <button className="new-chat-btn" onClick={onCreate} title="Nueva nota">
              <Plus size={16} />
            </button>
            <div className="knowledge-search">
              <Search size={16} />
              <input
                type="text"
                placeholder="Buscar notas..."
                value={filter}
                onChange={(event) => onFilterChange(event.target.value)}
              />
            </div>
          </div>

          <div className="knowledge-entry-list">
            {entries.map((entry) => (
              <button
                key={entry.id || entry.tempId}
                className={`knowledge-entry-card ${selectedEntryId === entry.id ? 'active' : ''}`}
                onClick={() => onSelect(entry)}
                type="button"
              >
                <div className="knowledge-entry-card-header">
                  <BookOpen size={14} />
                  <strong>{entry.title || 'Sin título'}</strong>
                </div>
                <span>{entry.category || 'General'}</span>
                <p>{entry.content?.slice(0, 100) || 'Empieza a documentar aquí...'}</p>
              </button>
            ))}
            {entries.length === 0 && (
              <div className="knowledge-empty">
                No hay entradas todavía. Crea una nota para guardar procedimientos o scripts.
              </div>
            )}
          </div>
        </aside>

        <section className="knowledge-editor glass">
          <div className="knowledge-form-grid">
            <input
              className="knowledge-input"
              placeholder="Título"
              value={form.title}
              onChange={(event) => onFormChange('title', event.target.value)}
            />
            <input
              className="knowledge-input"
              placeholder="Categoría"
              value={form.category}
              onChange={(event) => onFormChange('category', event.target.value)}
            />
          </div>

          <input
            className="knowledge-input"
            placeholder="Tags separados por coma"
            value={form.tags}
            onChange={(event) => onFormChange('tags', event.target.value)}
          />

          <textarea
            className="knowledge-textarea"
            placeholder="Documenta aquí scripts, procedimientos, observaciones, comandos o referencias..."
            value={form.content}
            onChange={(event) => onFormChange('content', event.target.value)}
          />

          <div className="knowledge-actions">
            <button className="gen-btn" onClick={onSave} disabled={isSaving}>
              <Save size={16} /> {isSaving ? 'Guardando...' : 'Guardar entrada'}
            </button>
            {selectedEntryId && (
              <button className="panic-btn panic-btn-wide" onClick={() => onDelete(selectedEntryId)} type="button">
                <Trash2 size={16} /> Eliminar
              </button>
            )}
          </div>

          <div className="knowledge-preview glass">
            <h3>Vista previa</h3>
            <ReactMarkdown>{form.content || 'La vista previa aparecerá aquí.'}</ReactMarkdown>
          </div>
        </section>
      </div>
    </MotionDiv>
  );
}

export default KnowledgeView;
