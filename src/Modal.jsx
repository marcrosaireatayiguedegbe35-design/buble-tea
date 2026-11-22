import { useEffect, useRef } from "react";

// Boîte de dialogue native <dialog> (accessible, Échap pour fermer)
export default function Modal({ onClose, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => { if (e.target === ref.current) ref.current.close(); }}
    >
      <div className="dlg">{children}</div>
    </dialog>
  );
}
