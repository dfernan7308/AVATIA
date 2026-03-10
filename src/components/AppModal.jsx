import { AnimatePresence, motion } from 'framer-motion';

function AppModal({ modal, onClose, onChange, onConfirm }) {
  const MotionDiv = motion.div;

  return (
    <AnimatePresence>
      {modal.show && (
        <MotionDiv
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <MotionDiv
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
                onChange={(event) => onChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    onConfirm();
                  }
                }}
                className="modal-input"
                placeholder="Escribe aquí..."
              />
            ) : (
              <p>{modal.value}</p>
            )}
            <div className="modal-actions">
              <button className="btn-secondary" onClick={onClose}>Cancelar</button>
              <button className="btn-primary" onClick={onConfirm}>
                {modal.type === 'input' ? 'Guardar' : 'Confirmar'}
              </button>
            </div>
          </MotionDiv>
        </MotionDiv>
      )}
    </AnimatePresence>
  );
}

export default AppModal;
