export const API_URL = 'https://api-kanban.matheusvandeursen.com/api';

export function getToken() {
    return localStorage.getItem('kanban_token');
}

export function setToken(token) {
    localStorage.setItem('kanban_token', token);
}

export function removeToken() {
    localStorage.removeItem('kanban_token');
}

export async function apiFetch(endpoint, method = 'GET', body = null, onSaving = null, onSaved = null, onError = null) {
    const token = getToken();
    const isMutation = method !== 'GET';
    
    if (isMutation && onSaving) onSaving();

    const options = {
        method,
        headers: { 'Content-Type': 'application/json' }
    };
    
    if (token) options.headers['Authorization'] = `Bearer ${token}`;
    if (body) options.body = JSON.stringify(body);

    const response = await fetch(`${API_URL}${endpoint}`, options);
    const data = await response.json().catch(() => ({}));
    
    if (!response.ok) {
        if (response.status === 401 && !data.error) {
            removeToken();
            window.location.href = 'login.html';
        }
        if (isMutation && onError) onError();
        throw new Error(data.error || 'Ocorreu um erro na requisição.');
    }
    
    if (isMutation && onSaved) onSaved();
    return data;
}