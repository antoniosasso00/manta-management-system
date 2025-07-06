import io
from typing import List, Dict
from reportlab.lib import colors
from reportlab.lib.pagesizes import A3, landscape
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.graphics.shapes import Drawing, Rect, String
from reportlab.graphics import renderPDF
import base64

from domain.entities import BatchLayout, Autoclave

class ExportService:
    """Servizio per esportare layout in formati stampabili"""
    
    def export_to_pdf(
        self,
        batches: List[BatchLayout],
        autoclaves: Dict[str, Autoclave],
        layout_images: Dict[str, str]
    ) -> bytes:
        """
        Esporta batch layouts in PDF per stampa.
        
        Args:
            batches: Lista di batch da esportare
            autoclaves: Dict[autoclave_id, Autoclave]
            layout_images: Dict[batch_id, base64_image]
        """
        buffer = io.BytesIO()
        
        # A3 landscape per layout grandi
        doc = SimpleDocTemplate(
            buffer,
            pagesize=landscape(A3),
            rightMargin=20*mm,
            leftMargin=20*mm,
            topMargin=20*mm,
            bottomMargin=20*mm
        )
        
        # Stili
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Title'],
            fontSize=24,
            textColor=colors.HexColor('#1976D2'),
            alignment=TA_CENTER
        )
        
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=16,
            textColor=colors.HexColor('#424242'),
            spaceAfter=12
        )
        
        elements = []
        
        # Pagina per ogni batch
        for i, batch in enumerate(batches):
            if i > 0:
                elements.append(PageBreak())
            
            autoclave = autoclaves.get(batch.autoclave_id)
            if not autoclave:
                continue
            
            # Titolo
            elements.append(
                Paragraph(f"Layout Batch - Autoclave {autoclave.code}", title_style)
            )
            elements.append(Spacer(1, 20))
            
            # Info batch
            info_data = [
                ['Autoclave:', autoclave.code],
                ['Dimensioni:', f'{autoclave.width} x {autoclave.height} mm'],
                ['Efficienza:', f'{batch.efficiency * 100:.1f}%'],
                ['Peso totale:', f'{batch.total_weight:.1f} kg'],
                ['Linee vuoto:', f'{batch.vacuum_lines_used}/{autoclave.vacuum_lines}'],
                ['Pezzi:', str(len(batch.placements))],
                ['ODL:', str(len(set(p.odl_id for p in batch.placements)))]
            ]
            
            info_table = Table(info_data, colWidths=[100, 200])
            info_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
                ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 12),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
                ('GRID', (0, 0), (-1, -1), 1, colors.grey)
            ]))
            
            elements.append(info_table)
            elements.append(Spacer(1, 20))
            
            # Immagine layout
            if batch.autoclave_id in layout_images:
                img_data = base64.b64decode(layout_images[batch.autoclave_id])
                img = Image(io.BytesIO(img_data), width=350*mm, height=200*mm)
                elements.append(img)
                elements.append(Spacer(1, 20))
            
            # Tabella coordinate
            elements.append(Paragraph("Lista Posizionamento", heading_style))
            
            coord_data = [['#', 'ODL', 'Tool', 'X (mm)', 'Y (mm)', 'L x H (mm)', 'Rotato', 'Livello']]
            
            sorted_placements = sorted(batch.placements, key=lambda p: (p.y, p.x))
            
            for i, p in enumerate(sorted_placements):
                coord_data.append([
                    str(i + 1),
                    p.odl_id[:10] + '...',
                    p.tool_id,
                    str(int(p.x)),
                    str(int(p.y)),
                    f'{int(p.width)} x {int(p.height)}',
                    '✓' if p.rotated else '',
                    'Rialzato' if p.level == 1 else 'Base'
                ])
            
            coord_table = Table(coord_data)
            coord_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1976D2')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey])
            ]))
            
            elements.append(coord_table)
        
        # Genera PDF
        doc.build(elements)
        buffer.seek(0)
        
        return buffer.read()
    
    def export_to_dxf(self, batch: BatchLayout, autoclave: Autoclave) -> str:
        """
        Esporta layout in formato DXF per CAD.
        Formato testuale semplificato.
        """
        dxf_content = []
        
        # Header DXF
        dxf_content.extend([
            "0", "SECTION",
            "2", "HEADER",
            "9", "$ACADVER", "1", "AC1015",
            "9", "$EXTMIN", "10", "0.0", "20", "0.0",
            "9", "$EXTMAX", "10", str(autoclave.width), "20", str(autoclave.height),
            "0", "ENDSEC"
        ])
        
        # Entities section
        dxf_content.extend(["0", "SECTION", "2", "ENTITIES"])
        
        # Bordo autoclave
        dxf_content.extend([
            "0", "LWPOLYLINE",
            "8", "0",  # Layer
            "90", "4",  # Numero vertici
            "70", "1",  # Chiuso
            "10", "0.0", "20", "0.0",
            "10", str(autoclave.width), "20", "0.0",
            "10", str(autoclave.width), "20", str(autoclave.height),
            "10", "0.0", "20", str(autoclave.height)
        ])
        
        # Placements
        for placement in batch.placements:
            # Rettangolo per ogni placement
            x1, y1 = placement.x, placement.y
            x2, y2 = x1 + placement.width, y1 + placement.height
            
            dxf_content.extend([
                "0", "LWPOLYLINE",
                "8", "TOOLS",  # Layer
                "62", "1" if placement.level == 0 else "2",  # Colore
                "90", "4",  # Numero vertici
                "70", "1",  # Chiuso
                "10", str(x1), "20", str(y1),
                "10", str(x2), "20", str(y1),
                "10", str(x2), "20", str(y2),
                "10", str(x1), "20", str(y2)
            ])
            
            # Testo con ID
            center_x = x1 + placement.width / 2
            center_y = y1 + placement.height / 2
            
            dxf_content.extend([
                "0", "TEXT",
                "8", "TEXT",
                "10", str(center_x), "20", str(center_y),
                "40", "50",  # Altezza testo
                "1", placement.tool_id  # Testo
            ])
        
        dxf_content.extend(["0", "ENDSEC", "0", "EOF"])
        
        return "\n".join(dxf_content)