#!/usr/bin/env python3
"""
Debug Overlap Detection
======================

Analizza i risultati per identificare overlap nei posizionamenti
e verifica la correttezza dell'algoritmo di collision detection.
"""

import requests
import json
from datetime import datetime, timedelta

# Configurazione
MICROSERVICE_URL = "http://localhost:8000"
API_BASE = f"{MICROSERVICE_URL}/api/v1"

def print_header(title: str):
    print(f"\n{'='*70}")
    print(f"🔍 {title}")
    print(f"{'='*70}")

def print_section(title: str):
    print(f"\n📊 {title}")
    print("-" * 50)

def generate_simple_test():
    """Genera test semplice per debug overlap"""
    
    autoclave = {
        "id": "AC-DEBUG",
        "code": "AUTOCLAVE-DEBUG",
        "width": 2000,
        "height": 1500,   
        "vacuum_lines": 4,
        "max_weight": 3000,
    }
    
    # Solo 4 ODL semplici per debug facile
    odls = []
    for i in range(4):
        tool = {
            "id": f"T{i+1}_1",
            "width": 600,   
            "height": 400, 
            "weight": 20,
        }
        
        odl = {
            "id": f"ODL-DEBUG-{i+1:02d}",
            "odl_number": f"ODL-DEBUG-{i+1:02d}",
            "part_number": f"PN-DEBUG-{i+1:02d}",
            "curing_cycle": "CICLO_DEBUG",
            "vacuum_lines": 1,
            "tools": [tool],
            "total_area": (600 * 400) / 1000000,
            "priority": "NORMAL",
            "due_date": (datetime.now() + timedelta(days=7)).isoformat(),
        }
        
        odls.append(odl)
    
    return odls, [autoclave]

def test_and_check_overlaps(odls, autoclaves):
    """Testa e verifica overlap"""
    
    payload = {
        "odls": odls,
        "autoclaves": autoclaves, 
        "selected_cycles": ["CICLO_DEBUG"],
        "elevated_tools": [],
        "constraints": {
            "min_border_distance": 20,
            "min_tool_distance": 15,
            "allow_rotation": True
        }
    }
    
    try:
        response = requests.post(
            f"{API_BASE}/optimization/execute",
            json=payload,
            timeout=30
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            print(f"❌ Errore API: {response.status_code}")
            return None
            
    except Exception as e:
        print(f"❌ Errore: {e}")
        return None

def check_placement_overlaps(placements, gap=15):
    """
    Verifica overlap tra placements con gap specificato.
    Ritorna lista di overlap rilevati.
    """
    
    overlaps = []
    
    for i, p1 in enumerate(placements):
        for j, p2 in enumerate(placements[i+1:], i+1):
            
            # Coordinate rettangoli SENZA espansione
            rect1 = {
                'id': p1['tool_id'],
                'x1': p1['x'],
                'y1': p1['y'],
                'x2': p1['x'] + p1['width'],
                'y2': p1['y'] + p1['height']
            }
            
            rect2 = {
                'id': p2['tool_id'], 
                'x1': p2['x'],
                'y1': p2['y'],
                'x2': p2['x'] + p2['width'],
                'y2': p2['y'] + p2['height']
            }
            
            # Calcola distanza effettiva tra i rettangoli
            dx = max(0, max(rect1['x1'], rect2['x1']) - min(rect1['x2'], rect2['x2']))
            dy = max(0, max(rect1['y1'], rect2['y1']) - min(rect1['y2'], rect2['y2']))
            
            # Verifica se la distanza è minore del gap richiesto
            if dx < gap and dy < gap:
                
                # Calcola area overlap teorica con gap
                overlap_x1 = max(rect1['x1'] - gap, rect2['x1'] - gap)
                overlap_y1 = max(rect1['y1'] - gap, rect2['y1'] - gap)
                overlap_x2 = min(rect1['x2'] + gap, rect2['x2'] + gap)
                overlap_y2 = min(rect1['y2'] + gap, rect2['y2'] + gap)
                
                overlap_area = max(0, overlap_x2 - overlap_x1) * max(0, overlap_y2 - overlap_y1)
                
                overlaps.append({
                    'tool1': p1['tool_id'],
                    'tool2': p2['tool_id'],
                    'overlap_area': overlap_area,
                    'distance_x': dx,
                    'distance_y': dy,
                    'rect1': rect1,
                    'rect2': rect2,
                    'placement1': p1,
                    'placement2': p2
                })
    
    return overlaps

def analyze_overlaps(result):
    """Analizza overlap nei risultati"""
    
    print_header("ANALISI OVERLAP DETECTION")
    
    if not result or not result.get("batches"):
        print("❌ Nessun risultato da analizzare")
        return
    
    total_overlaps = 0
    
    for i, batch in enumerate(result["batches"]):
        print_section(f"BATCH {i+1}: {batch['batch_id'][:8]}...")
        
        placements = batch.get("placements", [])
        print(f"   Tools posizionati: {len(placements)}")
        
        if len(placements) == 0:
            print("   ⚠️  Nessun placement da verificare")
            continue
        
        # Verifica overlap con gap 15mm
        overlaps = check_placement_overlaps(placements, gap=15)
        
        print(f"   Overlap rilevati: {len(overlaps)}")
        total_overlaps += len(overlaps)
        
        if overlaps:
            print("   ❌ OVERLAP DETECTION:")
            
            for j, overlap in enumerate(overlaps):
                print(f"   [{j+1}] {overlap['tool1']} ↔ {overlap['tool2']}")
                print(f"       Area overlap: {overlap['overlap_area']:.0f} mm²")
                
                p1 = overlap['placement1']
                p2 = overlap['placement2']
                
                print(f"       {overlap['tool1']}: ({p1['x']:.0f},{p1['y']:.0f}) → ({p1['x']+p1['width']:.0f},{p1['y']+p1['height']:.0f})")
                print(f"       {overlap['tool2']}: ({p2['x']:.0f},{p2['y']:.0f}) → ({p2['x']+p2['width']:.0f},{p2['y']+p2['height']:.0f})")
                
                # Usa distanze calcolate
                dx = overlap['distance_x']
                dy = overlap['distance_y']
                
                if dx == 0 and dy == 0:
                    print(f"       DISTANZA EFFETTIVA: OVERLAP DIRETTO!")
                else:
                    print(f"       Distanza X: {dx:.0f}mm, Y: {dy:.0f}mm (gap richiesto: 15mm)")
        else:
            print("   ✅ Nessun overlap rilevato")
        
        # Mostra posizioni dettagliate
        print("\n   POSIZIONI DETTAGLIATE:")
        for placement in placements:
            x, y = placement['x'], placement['y']
            w, h = placement['width'], placement['height']
            print(f"   {placement['tool_id']}: ({x:.0f},{y:.0f}) size {w:.0f}x{h:.0f} → end ({x+w:.0f},{y+h:.0f})")
    
    # Riepilogo
    print_section("RIEPILOGO OVERLAP")
    
    if total_overlaps > 0:
        print(f"❌ PROBLEMA RILEVATO: {total_overlaps} overlap totali")
        print("   Possibili cause:")
        print("   1. Bug nell'algoritmo collision detection")
        print("   2. Gap non rispettato correttamente")
        print("   3. Errore nel calcolo coordinate")
        print("   4. Problema nella validazione constraints")
    else:
        print("✅ NESSUN OVERLAP: Algoritmo funziona correttamente")

def draw_debug_layout(placements, autoclave, overlaps):
    """Disegna layout con evidenziazione overlap"""
    
    print_section("LAYOUT DEBUG CON OVERLAP")
    
    if not placements:
        print("   Nessun placement da visualizzare")
        return
    
    scale = 50  # mm per carattere
    canvas_width = int(autoclave["width"] / scale) + 2
    canvas_height = int(autoclave["height"] / scale) + 2
    
    # Canvas
    canvas = [['·' for _ in range(canvas_width)] for _ in range(canvas_height)]
    
    # Bordi autoclave
    for x in range(canvas_width):
        canvas[0][x] = canvas[canvas_height-1][x] = '─'
    for y in range(canvas_height):
        canvas[y][0] = canvas[y][canvas_width-1] = '│'
    
    # Simboli per tool
    symbols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
    overlap_tools = set()
    
    # Identifica tool con overlap
    for overlap in overlaps:
        overlap_tools.add(overlap['tool1'])
        overlap_tools.add(overlap['tool2'])
    
    # Disegna placements
    for i, placement in enumerate(placements):
        symbol = symbols[i % len(symbols)]
        tool_id = placement['tool_id']
        
        # Se ha overlap, usa simbolo di warning
        if tool_id in overlap_tools:
            symbol = '⚠' if i % 2 == 0 else '❌'
        
        start_x = max(1, int(placement["x"] / scale))
        start_y = max(1, int(placement["y"] / scale))
        width = max(1, int(placement["width"] / scale))
        height = max(1, int(placement["height"] / scale))
        
        # Riempi area
        for y in range(start_y, min(start_y + height, canvas_height - 1)):
            for x in range(start_x, min(start_x + width, canvas_width - 1)):
                canvas[y][x] = symbol
    
    # Stampa canvas
    for row in canvas:
        print("   " + "".join(row))
    
    print(f"\n   Legenda: A,B,C,D = Tool normali | ⚠,❌ = Tool con overlap")
    print(f"   Scala: 1 carattere = {scale}mm")

def main():
    """Debug overlap detection"""
    
    print_header("DEBUG OVERLAP DETECTION")
    print("Verifica accuratezza collision detection algoritmo")
    
    # Verifica microservizio
    try:
        response = requests.get(f"{API_BASE}/health/", timeout=5)
        if response.status_code != 200:
            print("❌ Microservizio non disponibile")
            return
        print("✅ Microservizio operativo")
    except Exception as e:
        print(f"❌ Connessione fallita: {e}")
        return
    
    # Genera test semplice
    print_section("GENERAZIONE TEST OVERLAP")
    odls, autoclaves = generate_simple_test()
    
    print(f"   ODL generati: {len(odls)}")
    print(f"   Tool size: 600x400mm ciascuno")
    print(f"   Gap richiesto: 15mm")
    print(f"   Autoclave: {autoclaves[0]['width']}x{autoclaves[0]['height']}mm")
    
    # Test ottimizzazione
    print_section("ESECUZIONE TEST")
    result = test_and_check_overlaps(odls, autoclaves)
    
    if result:
        # Analisi overlap
        analyze_overlaps(result)
        
        # Visualizzazione con debug
        if result.get("batches"):
            batch = result["batches"][0]
            placements = batch.get("placements", [])
            overlaps = check_placement_overlaps(placements, gap=15)
            
            draw_debug_layout(placements, autoclaves[0], overlaps)
    else:
        print("❌ Test fallito")

if __name__ == "__main__":
    main()