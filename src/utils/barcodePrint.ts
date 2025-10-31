// Импортируем jsbarcode - может быть как default, так и именованный экспорт
import JsBarcode from 'jsbarcode';

/**
 * Печатает штрихкод из номера ремонта
 * @param repairNumber - номер ремонта для печати
 */
export function printBarcode(repairNumber: string): void {
  if (!repairNumber || repairNumber.trim() === '') {
    alert('Номер ремонта не может быть пустым');
    return;
  }

  // Создаем временный canvas для генерации штрихкода
  const canvas = document.createElement('canvas');
  
  try {
    // Генерируем штрихкод CODE128
    // Параметры настроены для этикетки 40mm x 30mm
    JsBarcode(canvas, repairNumber, {
      format: 'CODE128',
      width: 1.5,
      height: 50,
      displayValue: true,
      fontSize: 14,
      textMargin: 4,
      margin: 2,
      background: '#ffffff'
    });

    // Получаем изображение штрихкода
    const barcodeDataURL = canvas.toDataURL('image/png');

    // Создаем новое окно для печати
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Не удалось открыть окно печати. Пожалуйста, разрешите всплывающие окна.');
      return;
    }

    // Создаем HTML для печати
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Печать штрихкода - ${repairNumber}</title>
          <style>
            @page {
              size: 40mm 30mm;
              margin: 0;
              padding: 0;
            }
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              margin: 0;
              padding: 0;
              width: 40mm;
              height: 30mm;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              font-family: Arial, sans-serif;
              overflow: hidden;
            }
            .label-content {
              text-align: center;
              width: 100%;
              height: 100%;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .barcode-image {
              max-width: 100%;
              max-height: 100%;
              width: auto;
              height: auto;
              display: block;
              margin: 0 auto;
              object-fit: contain;
            }
            @media print {
              @page {
                size: 40mm 30mm;
                margin: 0;
                padding: 0;
              }
              * {
                margin: 0;
                padding: 0;
              }
              body {
                margin: 0 auto;
                padding: 0;
                width: 40mm;
                height: 30mm;
                overflow: hidden;
              }
              .no-print {
                display: none !important;
              }
              .label-content {
                width: 100%;
                height: 100%;
              }
              .barcode-image {
                max-width: 100%;
                max-height: 100%;
                margin: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="label-content">
            <img src="${barcodeDataURL}" alt="Barcode ${repairNumber}" class="barcode-image" />
          </div>
          <button class="no-print" onclick="window.print()" style="margin-top: 20px; padding: 10px 20px; font-size: 16px; cursor: pointer;">
            Печать
          </button>
          <script>
            // Автоматически запускаем печать при загрузке
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 250);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();

  } catch (error) {
    console.error('Ошибка при генерации штрихкода:', error);
    alert('Не удалось сгенерировать штрихкод. Пожалуйста, проверьте номер ремонта.');
  }
}

