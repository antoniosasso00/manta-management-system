import io
import base64
from typing import List, Dict, Tuple, Optional
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import Rectangle, FancyBboxPatch
import matplotlib.colors as mcolors
import numpy as np

from domain.entities import BatchLayout, Placement, Autoclave

class LayoutGenerator:
    """Generatore di visualizzazioni 2D per layout batch"""
    
    # Colori per ODL diversi
    COLORS = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
        '#FF9FF3', '#54A0FF', '#48DBFB', '#1ABC9C', '#F39C12',
        '#E74C3C', '#9B59B6', '#3498DB', '#2ECC71', '#F1C40F'
    ]
    
    def __init__(self, dpi: int = 150):
        self.dpi = dpi
    
    def generate_layout_image(
        self,
        batch: BatchLayout,
        autoclave: Autoclave,
        show_coordinates: bool = True,
        show_metrics: bool = True,
        odl_mapping: Optional[Dict[str, Dict[str, str]]] = None
    ) -> str:
        """
        Genera immagine del layout e ritorna come base64.
        """
        # Crea figura con dimensioni proporzionali all'autoclave
        scale = 0.01  # 1mm = 0.01 inches per visualizzazione
        fig_width = autoclave.width * scale
        fig_height = autoclave.height * scale
        
        # Aggiungi spazio per metriche
        if show_metrics:
            fig_height += 2
        
        fig, ax = plt.subplots(1, 1, figsize=(fig_width, fig_height), dpi=self.dpi)
        
        # Imposta limiti e aspetto
        ax.set_xlim(0, autoclave.width)
        ax.set_ylim(0, autoclave.height)
        ax.set_aspect('equal')
        ax.invert_yaxis()  # Origine in alto a sinistra
        
        # Disegna bordo autoclave
        autoclave_rect = Rectangle(
            (0, 0), autoclave.width, autoclave.height,
            linewidth=3, edgecolor='black', facecolor='none'
        )
        ax.add_patch(autoclave_rect)
        
        # Mappa colori per ODL
        odl_colors = {}
        color_idx = 0
        
        # Disegna placements
        for placement in batch.placements:
            # Assegna colore per ODL
            if placement.odl_id not in odl_colors:
                odl_colors[placement.odl_id] = self.COLORS[color_idx % len(self.COLORS)]
                color_idx += 1
            
            color = odl_colors[placement.odl_id]
            
            # Stile diverso per livelli diversi
            if placement.level == 1:  # Supporti rialzati
                # Bordo tratteggiato per indicare elevazione
                rect = FancyBboxPatch(
                    (placement.x, placement.y),
                    placement.width, placement.height,
                    boxstyle="round,pad=5",
                    facecolor=color,
                    edgecolor='darkgray',
                    linewidth=2,
                    linestyle='--',
                    alpha=0.8
                )
            else:  # Livello base
                rect = Rectangle(
                    (placement.x, placement.y),
                    placement.width, placement.height,
                    facecolor=color,
                    edgecolor='black',
                    linewidth=1,
                    alpha=0.9
                )
            
            ax.add_patch(rect)
            
            # Aggiungi testo con info
            center_x = placement.x + placement.width / 2
            center_y = placement.y + placement.height / 2
            
            # Mostra part number o ODL number
            if odl_mapping and placement.odl_id in odl_mapping:
                display_text = odl_mapping[placement.odl_id]['part_number']
            else:
                display_text = f"ODL {placement.odl_id[:8]}"
            
            # Part number
            ax.text(
                center_x, center_y - 5,
                display_text,
                ha='center', va='center',
                fontsize=7, fontweight='bold',
                color='white' if placement.level == 0 else 'black'
            )
            
            # Tool ID
            ax.text(
                center_x, center_y + 5,
                f"Tool {placement.tool_id}",
                ha='center', va='center',
                fontsize=6,
                color='white' if placement.level == 0 else 'black'
            )
            
            # Coordinate se richieste
            if show_coordinates:
                coord_text = f"({int(placement.x)}, {int(placement.y)})"
                ax.text(
                    placement.x + 5, placement.y + 15,
                    coord_text,
                    fontsize=6,
                    color='darkred',
                    bbox=dict(boxstyle="round,pad=0.3", facecolor='white', alpha=0.7)
                )
            
            # Indicatore rotazione
            if placement.rotated:
                ax.text(
                    placement.x + placement.width - 20,
                    placement.y + 20,
                    "↻",
                    fontsize=12,
                    color='darkblue',
                    fontweight='bold'
                )
        
        # Griglia di riferimento
        ax.grid(True, alpha=0.3, linestyle=':', linewidth=0.5)
        
        # Etichette assi
        ax.set_xlabel('Larghezza (mm)', fontsize=10)
        ax.set_ylabel('Lunghezza (mm)', fontsize=10)
        # Trova ciclo di cura dal mapping
        curing_cycle = "N/A"
        if odl_mapping and batch.placements:
            first_odl = batch.placements[0].odl_id
            if first_odl in odl_mapping:
                curing_cycle = odl_mapping[first_odl]['curing_cycle']
        
        ax.set_title(f'Layout Autoclave {autoclave.code} - Ciclo {curing_cycle}', 
                    fontsize=12, fontweight='bold', pad=20)
        
        # Aggiungi metriche
        if show_metrics:
            metrics_text = self._format_metrics(batch, autoclave)
            fig.text(0.5, 0.02, metrics_text, 
                    ha='center', va='bottom',
                    fontsize=10,
                    bbox=dict(boxstyle="round,pad=0.5", facecolor='lightgray', alpha=0.8))
        
        # Legenda ODL con part number
        if len(odl_colors) > 1:
            legend_elements = []
            for odl_id, color in list(odl_colors.items())[:5]:
                if odl_mapping and odl_id in odl_mapping:
                    label = f"{odl_mapping[odl_id]['part_number']} ({odl_mapping[odl_id]['odl_number'][:8]})"
                else:
                    label = f'ODL {odl_id[:8]}...'
                legend_elements.append(patches.Patch(color=color, label=label))
            ax.legend(handles=legend_elements, loc='upper right', 
                     bbox_to_anchor=(1.15, 1), fontsize=8)
        
        # Salva in buffer
        buffer = io.BytesIO()
        plt.tight_layout()
        plt.savefig(buffer, format='png', dpi=self.dpi, bbox_inches='tight')
        plt.close(fig)
        
        # Converti in base64
        buffer.seek(0)
        image_base64 = base64.b64encode(buffer.read()).decode('utf-8')
        
        return image_base64
    
    def _format_metrics(self, batch: BatchLayout, autoclave: Autoclave) -> str:
        """Formatta metriche per visualizzazione"""
        metrics = [
            f"Efficienza: {batch.efficiency * 100:.1f}%",
            f"Peso totale: {batch.total_weight:.1f} kg",
            f"Linee vuoto: {batch.vacuum_lines_used}/{autoclave.vacuum_lines}",
            f"Pezzi posizionati: {len(batch.placements)}",
            f"ODL: {len(set(p.odl_id for p in batch.placements))}"
        ]
        return " | ".join(metrics)
    
    def generate_coordinate_list(
        self,
        batch: BatchLayout,
        autoclave: Autoclave
    ) -> List[Dict]:
        """
        Genera lista coordinate per aiutare operatori nel posizionamento.
        """
        coordinates = []
        
        # Ordina per posizione (bottom-left prima)
        sorted_placements = sorted(
            batch.placements,
            key=lambda p: (p.y, p.x)
        )
        
        for i, placement in enumerate(sorted_placements):
            coordinates.append({
                'sequence': i + 1,
                'odl_id': placement.odl_id,
                'tool_id': placement.tool_id,
                'position': {
                    'x': int(placement.x),
                    'y': int(placement.y)
                },
                'dimensions': {
                    'width': int(placement.width),
                    'height': int(placement.height)
                },
                'rotated': placement.rotated,
                'level': placement.level,
                'instructions': self._get_placement_instructions(placement, i + 1)
            })
        
        return coordinates
    
    def _get_placement_instructions(self, placement: Placement, sequence: int) -> str:
        """Genera istruzioni testuali per operatore"""
        instructions = []
        
        instructions.append(f"#{sequence}: Posiziona tool {placement.tool_id}")
        
        if placement.level == 1:
            instructions.append("⚠️ SU SUPPORTI RIALZATI")
        
        instructions.append(f"Coordinate: X={int(placement.x)}mm, Y={int(placement.y)}mm")
        
        if placement.rotated:
            instructions.append("↻ RUOTARE 90° in senso orario")
        
        instructions.append(f"Dimensioni finali: {int(placement.width)}x{int(placement.height)}mm")
        
        return " | ".join(instructions)