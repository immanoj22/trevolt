import toast from 'react-hot-toast';
import { IoCloseOutline } from 'react-icons/io5';

export const showToastMessage = (message, type) => {
    const commonOptions = {
        duration: 4000,
        className: `customToasterContainer ${type}-toast`,
        position: "top-right",
    };

    const renderToast = (t) => (
        <div className='d-flex gap-2 align-items-center'>
            <span>{message}</span>
            <button
                onClick={() => toast.dismiss(t.id)}
                className='toastCloseBtn'
            >
                <IoCloseOutline />
            </button>
        </div>
    );

    if (type === 'success') {
        toast.success(renderToast, commonOptions);
    } else if (type === 'error') {
        toast.error(renderToast, commonOptions);
    } else if (type === 'warning') {
        toast(renderToast, {
            icon: "⚠️",
            ...commonOptions,
        });
    } else {
        toast(renderToast, commonOptions);
    }
};


// /** Packages */
// import toast from 'react-hot-toast';

// export const showToastMessage = (message, type) => {
//     const commonOptions = { duration: 4000, className: `customToasterContainer ${type}-toast`, position: "top-right" };
//     if (type === 'success') {
//         toast.success(message, commonOptions);
//     } else if (type === 'error') {
//         toast.error(message, commonOptions);
//     } else if (type === 'warning') {
//         toast.error(message, {
//             ...commonOptions,
//             icon: "⚠️",
//         });
//     }
// };