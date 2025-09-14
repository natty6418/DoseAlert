// externalDrugAPI.js
// Handles external drug/medication lookup using FDA API
// Note: The Django API doesn't have drug lookup endpoints, so keeping FDA API calls

import axios from 'axios';

// Create a separate axios instance for external FDA API calls
const fdaApiClient = axios.create({
  baseURL: 'https://api.fda.gov',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const fetchDrugLabelInfo = async (upc) => {
    try {
        let response;
        
        try {
            response = await fdaApiClient.get(`/drug/label.json?search=openfda.package_ndc:"${upc}"&limit=1`);
        } catch (error) {
            if (error.response?.status === 404 || error.response?.status >= 400) {
                // Try alternative search
                response = await fdaApiClient.get(`/drug/label.json?search=openfda.upc:"${upc}"&limit=1`);
            } else {
                throw error;
            }
        }
        
        const data = response.data;
        if (data.results && data.results.length > 0) {
            return data.results[0]; // Return the first result
        } else {
            console.log('No label information found for the provided NDC.');
            return null;
        }
    } catch (error) {
        throw new Error(`Error fetching drug label information: ${error.message}`);
    }
};

export const fetchDrugSideEffects = async (packageNdc) => {
    try {
        const response = await fdaApiClient.get(`/drug/event.json?search=patient.drug.openfda.package_ndc:"${packageNdc}"&count=patient.reaction.reactionmeddrapt.exact`);
        
        const data = response.data;
        if (data.results && data.results.length > 0) {
            return data.results; // Return the list of side effects with counts
        } else {
            console.log('No side effects information found for the provided NDC.');
            return [];
        }
    } catch (error) {
        if (error.response?.status === 404 || error.response?.status >= 400) {
            return []; // Return empty array for not found or client errors
        }
        throw new Error(`Error fetching drug side effects information: ${error.message}`);
    }
};

// // Placeholder for future Django backend integration
// export async function lookupDrugInfoDjango(token, drugName) {
//     // Not implemented: No endpoint in backend API docs
//     throw new Error('Drug lookup endpoint not implemented in backend API.');
// }
