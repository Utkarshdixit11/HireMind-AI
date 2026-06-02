export const getTextFromPdf = async (file: File): Promise<string> => {
  const pdfjsLib = (window as any).pdfjsLib;
  if (!pdfjsLib) {
    throw new Error("pdf.js library is not loaded. Please check the CDN link in index.html.");
  }
  
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
  let textContent = '';
  
  for (let i = 1; i <= pdf.numPages; i++) {
    try {
      const page = await pdf.getPage(i);
      const text = await page.getTextContent();
      
      const items = text.items as any[];
      if (items.length === 0) continue;
      
      // Group items on the same page by Y coordinate to preserve vertical layout
      const linesMap: { [y: number]: any[] } = {};
      const yValues: number[] = [];
      const threshold = 5; // tolerance threshold for item heights
      
      for (const item of items) {
        if (!item.str || item.str.trim() === '') continue;
        const y = item.transform[5];
        
        let foundGroupY = yValues.find(val => Math.abs(val - y) < threshold);
        if (foundGroupY === undefined) {
          yValues.push(y);
          linesMap[y] = [item];
        } else {
          linesMap[foundGroupY].push(item);
        }
      }
      
      // Sort lines top-to-bottom (Y decreasing)
      yValues.sort((a, b) => b - a);
      
      let pageText = '';
      for (const y of yValues) {
        // Sort items inside this line left-to-right (X increasing)
        const lineItems = linesMap[y];
        lineItems.sort((a, b) => a.transform[4] - b.transform[4]);
        
        const lineStr = lineItems.map(item => item.str).join(' ');
        pageText += lineStr + '\n';
      }
      
      textContent += pageText + '\n';
    } catch (error) {
      console.error(`Error processing page ${i}:`, error);
    }
  }
  
  return textContent;
};
