import axios from 'axios';
import { getConfig } from './config.js';

function getClient() {
  const baseUrl = getConfig('baseUrl') || 'https://www.ticketmaster.com/commerce/v2';
  const apiKey = getConfig('apiKey');

  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  };

  if (apiKey) {
    headers['X-SSL-CERT-UID'] = apiKey;
  }

  return axios.create({
    baseURL: baseUrl,
    headers
  });
}

// ============================================================
// Event Offers (Official API endpoint)
// ============================================================

export async function getEventOffers(eventId, params = {}) {
  const client = getClient();
  const response = await client.get(`/events/${eventId}/offers`, { params });
  return response.data;
}

// Note: The Ticketmaster Commerce API v2 only has one official endpoint.
// The functions below are placeholders for common operations that would
// be useful in a production CLI but are not available in this API version.
// For full event search and discovery, use the Discovery API instead.
