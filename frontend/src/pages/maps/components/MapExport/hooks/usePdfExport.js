import jsPDF from 'jspdf';
import { useMapCapture } from './useMapCapture';
import createExportLegendsLayout from '../ExportLegendsLayout';

export const usePdfExport = () => {
    const { waitForImages, captureElement } = useMapCapture();

    const exportToPdf = async ({ canvas, title, selectedLegends = [], getLegendUrl }) => {
        const canvasRatio = canvas.width / canvas.height;
        const pageWidth = 297;
        const pageHeight = pageWidth / canvasRatio;

        const pdf = new jsPDF({
            unit: 'mm',
            format: [pageWidth, pageHeight],
            orientation: 'landscape'
        });

        pdf.addImage(canvas.toDataURL('image/jpeg', 0.9), 'JPEG', 0, 0, pageWidth, pageHeight);

        if (selectedLegends.length > 0) {
            const MM_TO_PX = 3.7795;
            const containerWidthPx = Math.round(pageWidth * MM_TO_PX);
            const containerHeightPx = Math.round(pageHeight * MM_TO_PX);
            const legendsContainer = createExportLegendsLayout(selectedLegends, getLegendUrl, containerWidthPx, containerHeightPx);
            
            document.body.appendChild(legendsContainer);

            await waitForImages(legendsContainer);

            legendsContainer.querySelectorAll('img').forEach(img => {
                if (img.naturalWidth > 0) {
                    img.style.width = `${img.naturalWidth / 3}px`;
                    img.style.height = `${img.naturalHeight / 3}px`;
                    img.style.maxWidth = 'none';
                }
            });

            const legendsCanvas = await captureElement(legendsContainer, { scale: 2 });

            document.body.removeChild(legendsContainer);

            pdf.addPage([pageWidth, pageHeight], 'landscape');
            pdf.addImage(legendsCanvas.toDataURL('image/jpeg', 1), 'JPEG', 0, 0, pageWidth, pageHeight);
        }

        const date = new Date().toISOString().slice(0, 10);
        pdf.save(`${title}_${date}.pdf`);
    };

    const exportToImage = (canvas, format, title) => {
        const date = new Date().toISOString().slice(0, 10);
        const link = document.createElement('a');
        link.download = `${title}_${date}.${format}`;
        link.href = canvas.toDataURL(`image/${format}`, 0.9);
        link.click();
    };

    return {
        exportToPdf,
        exportToImage
    };
};
