import { useState, useEffect } from 'react';
import localStore from 'utils/localStore';

export function useLocalStorage<T>(key: string, initialValue: T) {
	const [storedValue, setStoredValue] = useState<T>(initialValue);

	useEffect(() => {
		const item = localStore.get<T>(key);
		setValue(item != null ? item : initialValue);
	}, []);

	const setValue = (value: T) => {
		const valueToStore = value instanceof Function ? value(storedValue) : value;
		setStoredValue(valueToStore);
		localStore.set(key, valueToStore);
	};

	return [storedValue, setValue] as const;
}

export default useLocalStorage;
