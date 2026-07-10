import Papa from "papaparse";

export function parseCSV(csvString) {
    const result = Papa.parse(csvString, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
    });
    
    console.log(result.data);
    
    return result.data;
}

export function splitIntoBatches(data, batchSize) {
    const batches = [];
    for (let i = 0; i < data.length; i += batchSize) {
        batches.push(data.slice(i, i + batchSize));
    }
    return batches;
}