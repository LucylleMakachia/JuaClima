import { Parser } from "json2csv";

/**
 * Convert an array of Mongoose documents to CSV string
 * @param {Array} datasets - Array of dataset documents
 * @returns {string} CSV formatted string
 */
export function convertToCSV(datasets) {
  if (!datasets.length) return "";

  // Prepare data by mapping and removing unwanted fields
  const data = datasets.map(d => {
    const obj = d.toObject ? d.toObject() : d;
    const { location, __v, _id, ...rest } = obj;

    // Flatten geometry into JSON string, or skip if you want
    rest.geometry = JSON.stringify(location);

    return rest;
  });

  // Get all fields (keys) from first object
  const fields = Object.keys(data[0]);

  const parser = new Parser({ fields });
  const csv = parser.parse(data);

  return csv;
}
