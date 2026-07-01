import { useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { AlertCircle, Download, FileSpreadsheet, UploadIcon } from "lucide-react";
import { useUploadProducts } from "@/lib/react-query/product-query";
import * as XLSX from 'xlsx';

// Sample template for jewelry products
const sampleJewelryData = [
  {
    "Product Title": "Sterling Silver Infinity Ring",
    "Product Slug": "sterling-silver-infinity-ring",
    "SKU": "SS-IR-001",
    "Regular Price": "2499",
    "Sale Price": "1999",
    "Product Description": "Elegant 925 sterling silver ring featuring a classic infinity symbol studded with cubic zirconia.",
    "Category": "Rings",
    "GST": "3",
    "Stock": "30"
  },
  {
    "Product Title": "Gold Plated Pendant Necklace",
    "Product Slug": "gold-plated-pendant-necklace",
    "SKU": "GP-PN-002",
    "Regular Price": "3499",
    "Sale Price": "2999",
    "Product Description": "18K gold plated silver pendant necklace with a brilliant cut solitaire design.",
    "Category": "Necklaces",
    "GST": "3",
    "Stock": "25"
  },
  {
    "Product Title": "Silver Hoop Earrings",
    "Product Slug": "silver-hoop-earrings",
    "SKU": "SS-HE-003",
    "Regular Price": "1499",
    "Sale Price": "1199",
    "Product Description": "Classic medium-sized sterling silver hoop earrings with secure click-top closure.",
    "Category": "Earrings",
    "GST": "3",
    "Stock": "50"
  }
];

const BulkProductUpload = () => {
  const [file, setFile] = useState<File | null>(null);

  const [previewData, setPreviewData] = useState<any[]>([]);
  const { mutate, isPending } = useUploadProducts();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      parseFile(selectedFile);
    }
  };

  const parseFile = async (file: File) => {
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        setPreviewData(jsonData.slice(0, 5) as any[]);
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error("Error parsing file:", error);
    }
  };

  const handleUpload = () => {
    if (!file) return;
    
    // Read the full file and process it for the API
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        // Transform the data to match the API requirements
        const formattedData = jsonData.map((item: any) => ({
          productTitle: item['Product Title'],
          productSlug: item['Product Slug'],
          skuNo: item['SKU'],
          regularPrice: parseFloat(item['Regular Price'] || '0'),
          salePrice: parseFloat(item['Sale Price'] || '0'),
          productDescription: item['Product Description'],
          category: item['Category'],
          gst: parseFloat(item['GST'] || '0'),
          stock: parseInt(item['Stock'] || '0', 10),
        }));
        
        // Send the formatted data to the API
        mutate({ products: formattedData });
      } catch (error) {
        console.error("Error processing file for upload:", error);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const downloadTemplate = () => {
    const worksheet = XLSX.utils.json_to_sheet(sampleJewelryData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Jewelry Products");
    XLSX.writeFile(workbook, "jewelry_products_template.xlsx");
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Bulk Product Upload</h1>
      
      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">Upload Products</TabsTrigger>
          <TabsTrigger value="template">Download Template</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload Product Data</CardTitle>
                <CardDescription>
                Upload an Excel or CSV file containing your product data.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <input
                  type="file"
                  id="file-upload"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="file-upload"
                  className="flex flex-col items-center justify-center cursor-pointer"
                >
                  <UploadIcon className="h-10 w-10 text-gray-400 mb-2" />
                  <span className="text-sm font-medium text-gray-900">
                    {file ? file.name : "Click to upload or drag and drop"}
                  </span>
                  <span className="text-xs text-gray-500 mt-1">
                    XLSX, XLS, CSV up to 10MB
                  </span>
                </label>
              </div>
              
              {file && previewData.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium mb-2">Preview (first 5 rows):</h3>
                  <div className="overflow-x-auto border rounded">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          {Object.keys(previewData[0]).map((header) => (
                            <th 
                              key={header} 
                              className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {previewData.map((row, rowIndex) => (
                          <tr key={rowIndex}>
                            {Object.values(row).map((value: any, colIndex) => (
                              <td key={colIndex} className="px-4 py-2 whitespace-nowrap text-sm">
                                {value}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-700" />
                <AlertTitle className="text-blue-700">Important</AlertTitle>
                <AlertDescription className="text-blue-600">
                  Make sure your file has the required columns: Product Title, Product Slug, SKU, Regular Price,
                  Sale Price, Product Description, Category, GST, Stock, etc.
                </AlertDescription>
              </Alert>
              
              <Button 
                onClick={handleUpload} 
                disabled={!file || isPending}
                className="w-full"
              >
                {isPending ? "Uploading..." : "Upload and Process"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="template" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Download Template</CardTitle>
              <CardDescription>
                Download a template Excel file to help you format your jewelry product data correctly.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center p-4 border rounded bg-gray-50">
                <FileSpreadsheet className="h-8 w-8 mr-4 text-green-600" />
                <div className="flex-1">
                  <h3 className="font-medium">Jewelry Products Template</h3>
                  <p className="text-sm text-gray-500">XLSX format with all required fields</p>
                </div>
                <Button onClick={downloadTemplate} variant="outline" className="flex items-center">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
              
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Template Structure</AlertTitle>
                <AlertDescription>
                  <p>The template includes the following columns:</p>
                  <ul className="list-disc pl-5 mt-2 text-sm space-y-1">
                    <li>Product Title - The name of your product</li>
                    <li>Product Slug - URL-friendly version of the title</li>
                    <li>SKU - Unique product identifier</li>
                    <li>Regular Price - Original price</li>
                    <li>Sale Price - Discounted price</li>
                    <li>Product Description - Detailed description</li>
                    <li>Category - Product category</li>
                    <li>GST - Tax percentage</li>
                    <li>Stock - Current inventory quantity</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BulkProductUpload;
