import Papa from 'papaparse';

/**
 * Parses a CSV file into an array of objects.
 * @param {File} file - The CSV file to parse.
 * @returns {Promise<{headers: string[], data: object[], errors: any[]}>}
 */
export const parseCSV = (file) => {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                resolve({
                    headers: results.meta.fields || [],
                    data: results.data || [],
                    errors: results.errors || []
                });
            },
            error: (error) => {
                reject(error);
            }
        });
    });
};
