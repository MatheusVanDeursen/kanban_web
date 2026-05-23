import { apiFetch } from './httpClient.js';
import { onSaving, onSaved, onError } from '../components/syncIndicator.js';

export function kanbanFetch(endpoint, method = 'GET', body = null) {
    return apiFetch(endpoint, method, body, onSaving, onSaved, onError);
}