export const GetLocalStorageItem = ({ key }) => {
    if (key) {
        const token = localStorage.getItem(key);
        return token ? token : '';
    }
    return '';
}
export const SetLocalStorageItem = ({ key, value }) => {
    if (key) {
        const token = localStorage.setItem(key, value);
        return token ? token : '';
    }
    return '';
}
export const RemoveItemLocalStorageItem = ({ key }) => {
    if (key) {
        const token = localStorage.removeItem(key);
        return token ? token : '';
    }
    return '';
}