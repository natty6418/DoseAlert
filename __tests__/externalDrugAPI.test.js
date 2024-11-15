import { fetchDrugLabelInfo, fetchDrugSideEffects } from "../services/externalDrugAPI";
// const fetch = require('node-fetch');

// jest.mock('node-fetch', () => jest.fn());

// const fetch = require('node-fetch');
global.fetch = jest.fn();

// Helper function to set up a successful mock fetch response
const mockFetchSuccess = (data) => {
    fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => data,
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    });
};

// Helper function to set up a failed mock fetch response
const mockFetchFailure = () => {
    fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({}),
    });
};

// Helper function to set up a generic fetch error
const mockFetchError = (message) => {
    fetch.mockRejectedValueOnce({message});
};

// Tests for fetchDrugLabelInfo
describe('fetchDrugLabelInfo', () => {
    const validUpc = '123456789';
    const invalidUpc = '000000000';

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should fetch drug label information successfully', async () => {
        const mockData = {
            results: [
                {
                    id: '1',
                    openfda: { brand_name: ['Aspirin'] },
                },
            ],
        };
        mockFetchSuccess(mockData);

        const result = await fetchDrugLabelInfo(validUpc);

        expect(result).toEqual(mockData.results[0]);
        expect(fetch).toHaveBeenCalledTimes(1);
        expect(fetch).toHaveBeenCalledWith(`https://api.fda.gov/drug/label.json?search=openfda.package_ndc:"${validUpc}"&limit=1`);
    });

    it('should fall back to second URL if the first request fails', async () => {
        mockFetchFailure(); // First fetch fails
        const mockData = {
            results: [
                {
                    id: '2',
                    openfda: { brand_name: ['Ibuprofen'] },
                },
            ],
        };
        mockFetchSuccess(mockData); // Second fetch succeeds

        const result = await fetchDrugLabelInfo(validUpc);

        expect(result).toEqual(mockData.results[0]);
        expect(fetch).toHaveBeenCalledTimes(2);
        expect(fetch).toHaveBeenNthCalledWith(1, `https://api.fda.gov/drug/label.json?search=openfda.package_ndc:"${validUpc}"&limit=1`);
        expect(fetch).toHaveBeenNthCalledWith(2, `https://api.fda.gov/drug/label.json?search=openfda.upc:"${validUpc}"&limit=1`);
    });

    it('should return null if no label information is found', async () => {
        const mockData = { results: [] };
        mockFetchSuccess(mockData);

        const result = await fetchDrugLabelInfo(invalidUpc);

        expect(result).toBeNull();
        expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('should throw an error if fetch fails', async () => {
        mockFetchError('Network error');

        await expect(fetchDrugLabelInfo(validUpc)).rejects.toThrow('Error fetching drug label information: Network error');
        expect(fetch).toHaveBeenCalledTimes(1);
    });
});

// Tests for fetchDrugSideEffects
describe('fetchDrugSideEffects', () => {
    const validPackageNdc = '123456789';
    const invalidPackageNdc = '000000000';

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should fetch drug side effects information successfully', async () => {
        const mockData = {
            results: [
                { term: 'Nausea', count: 5 },
                { term: 'Headache', count: 3 },
            ],
        };
        mockFetchSuccess(mockData);

        const result = await fetchDrugSideEffects(validPackageNdc);

        expect(result).toEqual(mockData.results);
        expect(fetch).toHaveBeenCalledTimes(1);
        expect(fetch).toHaveBeenCalledWith(`https://api.fda.gov/drug/event.json?search=patient.drug.openfda.package_ndc:"${validPackageNdc}"&count=patient.reaction.reactionmeddrapt.exact`);
    });

    it('should return an empty array if the response is not ok', async () => {
        mockFetchFailure();

        const result = await fetchDrugSideEffects(invalidPackageNdc);

        expect(result).toEqual([]);
        expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('should return null if no side effects information is found', async () => {
        const mockData = { results: [] };
        mockFetchSuccess(mockData);

        const result = await fetchDrugSideEffects(validPackageNdc);

        expect(result.length).toEqual(0);
        expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('should throw an error if fetch fails', async () => {
        mockFetchError('Network error');

        await expect(fetchDrugSideEffects(validPackageNdc)).rejects.toThrow('Error fetching drug side effects information: Network error');
        expect(fetch).toHaveBeenCalledTimes(1);
    });
});