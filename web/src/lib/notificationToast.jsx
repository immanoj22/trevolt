/** Packages */
import toast from 'react-hot-toast';

export const notificationToast = (message, content) => {
  toast.custom(
    (t) => (
      <div
        className={`notificationToastPart ${t.visible ? 'show' : 'hide'}`}
        onClick={() => toast.dismiss(t.id)}
      >
        <div className="toast-content">
          <h3>{message}</h3>
          <p>{content}</p>
        </div>
        <button
          className="toast-close"
          onClick={(e) => {
            e.stopPropagation();
            toast.dismiss(t.id);
          }}
        >
          ×
        </button>
      </div>
    ),
    {
      position: 'top-right',
      duration: 4000,
    }
  );
};
