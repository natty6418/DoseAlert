export const fetchDrugLabelInfo = async (upc) => {
    try {
      let response = await fetch(`https://api.fda.gov/drug/label.json?search=openfda.package_ndc:"${upc}"&limit=1`);

      if (!response.ok) {
        response = await fetch(`https://api.fda.gov/drug/label.json?search=openfda.upc:"${upc}"&limit=1`);
      if (!response.ok) {
        throw new Error('Failed to fetch drug label information');
      }
      }
  
      const data = await response.json();
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
      const response = await fetch(`https://api.fda.gov/drug/event.json?search=patient.drug.openfda.package_ndc:"${packageNdc}"&count=patient.reaction.reactionmeddrapt.exact`);
      if (!response.ok) {
        return [];
      }
  
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        return data.results; // Return the list of side effects with counts
      } else {
        console.log('No side effects information found for the provided NDC.');
        return null;
      }
    } catch (error) {
      throw new Error(`Error fetching drug side effects information: ${error.message}`);
    }
  };
