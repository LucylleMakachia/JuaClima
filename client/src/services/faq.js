const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/faqs';

/**
 * Get paginated FAQs
 * @param {number} page 
 * @param {number} limit 
 */
export async function fetchFaqs(page = 1, limit = 20) {
  try {
    const res = await fetch(`${API_BASE_URL}?page=${page}&limit=${limit}`);
    if (!res.ok) throw new Error('Failed to fetch FAQs');
    return await res.json();
  } catch (error) {
    console.error('fetchFaqs error:', error.message);
    throw error;
  }
}

/**
 * Create a new FAQ
 * Requires auth token
 */
export async function createFaq(data, token) {
  try {
    const res = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create FAQ');
    return await res.json();
  } catch (error) {
    console.error('createFaq error:', error.message);
    throw error;
  }
}

/**
 * Update an existing FAQ
 */
export async function updateFaq(id, data, token) {
  try {
    const res = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update FAQ');
    return await res.json();
  } catch (error) {
    console.error('updateFaq error:', error.message);
    throw error;
  }
}

/**
 * Delete a FAQ
 */
export async function deleteFaq(id, token) {
  try {
    const res = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) throw new Error('Failed to delete FAQ');
    return await res.json();
  } catch (error) {
    console.error('deleteFaq error:', error.message);
    throw error;
  }
}
