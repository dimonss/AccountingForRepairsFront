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

    // Определяем, работаем ли мы в PWA режиме
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         (window.navigator as any).standalone === true ||
                         document.referrer.includes('android-app://');

    // Создаем HTML для печати
    const printContent = `
      <!DOCTYPE html>
      <html lang="ru">
        <head>
          <title>Печать штрихкода - ${repairNumber}</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
              padding: 10px;
              min-height: 100vh;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              font-family: Arial, sans-serif;
              background: #f5f5f5;
            }
            .controls {
              position: fixed;
              bottom: 10px;
              right: 10px;
              left: 10px;
              display: flex;
              gap: 10px;
              z-index: 1000;
              justify-content: center;
              flex-wrap: wrap;
            }
            @media (max-width: 480px) {
              .controls {
                flex-direction: column;
              }
              .btn {
                width: 100%;
              }
            }
            .btn {
              padding: 12px 24px;
              border: none;
              border-radius: 8px;
              font-size: 16px;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.3s ease;
              box-shadow: 0 2px 8px rgba(0,0,0,0.2);
              min-width: 120px;
            }
            .btn-print {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
            }
            .btn-print:hover {
              transform: translateY(-2px);
              box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
            }
            .btn-close {
              background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
              color: white;
            }
            .btn-close:hover {
              transform: translateY(-2px);
              box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
            }
            .label-content {
              text-align: center;
              background: white;
              padding: 20px;
              border-radius: 8px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.1);
              margin: 60px 0 20px 0;
            }
            .barcode-image {
              max-width: 100%;
              max-height: 400px;
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
                background: white;
              }
              .no-print {
                display: none !important;
              }
              .label-content {
                width: 100%;
                height: 100%;
                padding: 0;
                margin: 0;
                box-shadow: none;
                border-radius: 0;
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
          <div class="controls no-print">
            <button class="btn btn-print" onclick="window.print()">
              Печать
            </button>
            <button class="btn btn-close" onclick="closeWindow()">
              Закрыть
            </button>
          </div>
          <div class="label-content">
            <img src="${barcodeDataURL}" alt="Barcode ${repairNumber}" class="barcode-image" />
          </div>
          <script>
            // Автоматически запускаем печать при загрузке (только если это не PWA)
            var isStandalone = ${isStandalone};
            window.onload = function() {
              if (!isStandalone) {
                setTimeout(function() {
                  window.print();
                }, 250);
              }
            };
            
            // Обработка закрытия окна через Escape
            document.addEventListener('keydown', function(e) {
              if (e.key === 'Escape') {
                closeWindow();
              }
            });
            
            // Надежная функция закрытия окна с поддержкой PWA
            function closeWindow() {
              try {
                // Метод 1: Прямое закрытие если окно было открыто скриптом
                try {
                  window.close();
                  // Даем время на закрытие
                  setTimeout(function() {
                    if (!document.hidden && !window.closed) {
                      // Если окно не закрылось, пробуем другие методы
                      tryAlternativeClose();
                    }
                  }, 200);
                  return;
                } catch(e) {
                  // Продолжаем к альтернативным методам
                }
                
                tryAlternativeClose();
              } catch(err) {
                tryAlternativeClose();
              }
            }
            
            // Альтернативные способы закрытия
            function tryAlternativeClose() {
              try {
                // Метод 1: Возврат назад через history (работает в большинстве случаев)
                if (window.history.length > 1) {
                  window.history.back();
                  return;
                }
                
                // Метод 2: Попытка через opener
                if (window.opener && !window.opener.closed) {
                  window.opener.focus();
                  setTimeout(function() {
                    window.close();
                  }, 100);
                  return;
                }
                
                // Метод 3: Для PWA - показываем сообщение и инструкцию
                var isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                           (typeof navigator !== 'undefined' && navigator.standalone === true);
                           
                if (isPWA) {
                  // В PWA режиме показываем информативное сообщение
                  showCloseMessage();
                } else {
                  // В обычном режиме пробуем редирект
                  try {
                    window.location.href = 'about:blank';
                    setTimeout(function() {
                      window.close();
                    }, 100);
                  } catch(e) {
                    showCloseMessage();
                  }
                }
              } catch(err) {
                showCloseMessage();
              }
            }
            
            // Показать сообщение с инструкцией по закрытию
            function showCloseMessage() {
              var messageDiv = document.createElement('div');
              messageDiv.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); color: white; display: flex; align-items: center; justify-content: center; z-index: 10000; padding: 20px; text-align: center; font-family: Arial, sans-serif;';
              messageDiv.innerHTML = '<div style="background: white; color: #333; padding: 30px; border-radius: 12px; max-width: 400px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);"><h2 style="margin-top: 0; color: #667eea;">Как закрыть это окно</h2><p>Используйте один из способов:</p><ul style="text-align: left; padding-left: 20px;"><li>Нажмите кнопку "Назад" в браузере</li><li>Используйте жест свайпа назад (на мобильных)</li><li>Закройте вкладку вручную</li></ul><button onclick="this.parentElement.parentElement.remove()" style="margin-top: 20px; padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px; font-weight: 600;">Понятно</button></div>';
              document.body.appendChild(messageDiv);
            }
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

