import { Image as ImageIcon, Loader2, Paperclip, X } from 'lucide-react';
import { motion } from 'framer-motion';

function ImageView({
  generatedImageUrl,
  imageEngine,
  imagePrompt,
  imageRef,
  isGenerating,
  onGenerate,
  onImagePromptChange,
  onRefImageChange,
  onRemoveRef,
  setImageEngine,
}) {
  const MotionDiv = motion.div;

  return (
    <MotionDiv key="images" className="images-interface" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
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
              <input type="file" className="sr-only" onChange={onRefImageChange} accept="image/*" />
            </label>
            {imageRef && (
              <div className="ref-preview-small">
                <img src={imageRef.url} alt="Style Ref" />
                <X size={12} className="remove-ref" onClick={onRemoveRef} />
              </div>
            )}
            <p className="ref-hint">AVATIA analizará esta imagen para replicar su estilo artístico.</p>
          </div>

          <div className="engine-toggle-box glass">
            <button
              className={`engine-btn ${imageEngine === 'dalle' ? 'active' : ''}`}
              onClick={() => setImageEngine('dalle')}
            >
              DALL-E 3
            </button>
            <button
              className={`engine-btn ${imageEngine === 'gemini' ? 'active' : ''}`}
              onClick={() => setImageEngine('gemini')}
            >
              Gemini 3.1 Flash (HD)
            </button>
          </div>

          <textarea
            placeholder="Describe la imagen que tienes en mente con todo detalle..."
            value={imagePrompt}
            onChange={(event) => onImagePromptChange(event.target.value)}
          />
          <button className="gen-btn" onClick={onGenerate} disabled={isGenerating}>
            {isGenerating ? 'Generando...' : 'Generar Obra de Arte'}
          </button>
        </div>
      </div>
    </MotionDiv>
  );
}

export default ImageView;
