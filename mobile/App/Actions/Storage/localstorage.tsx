import { MMKV } from 'react-native-mmkv';

export const storage = new MMKV({
  id: 'trevolt_storage',
  encryptionKey: 'trevolt_demo_storage_key',
});

export const setItem = (key: string, value: string) => {
  storage.set(key, value);
  return Promise.resolve(true);
};

export const getItem = (key: string) => {
  const value = storage.getString(key);
  return value ? value : '';
};

export const removeItem = (key: string) => {
  const value = storage.delete(key);
  return Promise.resolve(value);
};

export const removeAllItems = (except?: any) => {
  const keys = storage.getAllKeys();
  keys.forEach((key) => {
    if (!except.includes(key)) {
      storage.delete(key);
    }
  });
  return true;
};

export const destroyStorage = () => {
  storage.clearAll();
  return true;
};

export const Setmobiletheme = (data: any) => {
  storage.set("mobiletheme", (data));
}

export const Getmobiletheme = () => {
  return (storage.getString('mobiletheme'));
}