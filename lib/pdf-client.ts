import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

export async function convertHtmlToPdfBase64(htmlContent: string): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const iframe = document.createElement('iframe')
      iframe.style.width = '816px' // 8.5in width at 96 DPI
      iframe.style.minHeight = '1200px' // 12.5in height at 96 DPI
      iframe.style.position = 'absolute'
      iframe.style.left = '-9999px'
      iframe.style.top = '0'
      document.body.appendChild(iframe)

      const doc = iframe.contentDocument || iframe.contentWindow?.document
      if (!doc) {
        throw new Error("Iframe document not accessible")
      }

      doc.open()
      doc.write(htmlContent)
      doc.close()
      
      // Wait for content (like images and fonts) to fully render
      setTimeout(async () => {
        try {
          const body = doc.body
          
          // html2canvas ignores @page margins. We must manually inject physical padding
          // to simulate the A4 print margins, otherwise it stretches to the very edges!
          // We use 0 top margin to push it as far up as physically possible
          body.style.padding = '0 0.25in 0.3in 0.25in'
          body.style.backgroundColor = 'white'
          body.style.textRendering = 'optimizeLegibility'
          body.style.setProperty('-webkit-font-smoothing', 'antialiased')

          // Smart Page Break Simulator:
          // html2canvas doesn't understand page breaks, so we manually calculate if elements cross the Long height line (1200px).
          const PAGE_HEIGHT = 1200;
          const elementsToProtect = doc.querySelectorAll('.footer-layout, tr, .info-item')
          const elementsArray = Array.from(elementsToProtect)
          
          for (let i = 0; i < elementsArray.length; i++) {
            const el = elementsArray[i] as HTMLElement
            // Get fresh coordinates because previous insertions push subsequent elements down
            const top = el.getBoundingClientRect().top
            const height = el.getBoundingClientRect().height
            const pageEnd = Math.floor(top / PAGE_HEIGHT) * PAGE_HEIGHT + PAGE_HEIGHT
            
            // If the element's bottom crosses the page boundary, push it down!
            if (top + height > pageEnd && top < pageEnd) {
              const pushDown = (pageEnd - top) + 20 // Push past the line with 20px safe buffer
              
              if (el.tagName.toLowerCase() === 'tr') {
                const tbody = el.parentElement;
                const table = tbody?.parentElement;
                
                if (table && table.tagName.toLowerCase() === 'table') {
                  const newTable = table.cloneNode(false) as HTMLTableElement
                  
                  const thead = table.querySelector('thead')
                  if (thead) newTable.appendChild(thead.cloneNode(true))
                  
                  const newTbody = doc.createElement('tbody')
                  newTable.appendChild(newTbody)
                  
                  let currentRow: Element | null = el;
                  while (currentRow) {
                      const nextRow: Element | null = currentRow.nextElementSibling;
                      newTbody.appendChild(currentRow);
                      currentRow = nextRow;
                  }
                  
                  table.parentNode?.insertBefore(newTable, table.nextSibling)
                  
                  // Force the new table to start precisely at the next page
                  const newTableTop = newTable.getBoundingClientRect().top
                  const requiredPush = pageEnd - newTableTop + 20
                  if (requiredPush > 0) {
                    newTable.style.marginTop = `${requiredPush}px`
                  }
                }
              } else {
                el.style.marginTop = `${parseFloat(getComputedStyle(el).marginTop || '0') + pushDown}px`
              }
            }
          }

          const canvas = await html2canvas(body, {
            scale: 4, // Extremely high scale for crisp text
            useCORS: true,
            logging: false,
            windowWidth: 816,
            windowHeight: body.scrollHeight
          })

          const imgData = canvas.toDataURL('image/jpeg', 1.0)
          
          // Calculate PDF dimensions based on Long size
          const pdf = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: [215.9, 317.5] // 8.5 x 12.5 inches
          })
          
          const pdfWidth = pdf.internal.pageSize.getWidth()
          const pageHeight = pdf.internal.pageSize.getHeight()
          const imgHeight = (canvas.height * pdfWidth) / canvas.width
          let heightLeft = imgHeight
          let position = 0
          
          pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight)
          heightLeft -= pageHeight

          // Only add a new page if there's more than 5mm of content spilling over.
          // This prevents blank second pages caused by a few pixels of empty bottom margin.
          while (heightLeft > 5) {
            position = position - pageHeight
            pdf.addPage()
            pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight)
            heightLeft -= pageHeight
          }
          
          const base64String = pdf.output('datauristring')
          document.body.removeChild(iframe)
          
          resolve(base64String)
        } catch (err) {
          document.body.removeChild(iframe)
          reject(err)
        }
      }, 1500)
    } catch (error) {
      reject(error)
    }
  })
}
