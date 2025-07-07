#!/usr/bin/env python3
"""
Visualizzatore Layout Autoclavi
===============================

Genera e visualizza graficamente i risultati di posizionamento in ASCII art.
"""

import requests
import json
from datetime import datetime, timedelta
import random

# Configurazione
MICROSERVICE_URL = "http://localhost:8000"
API_BASE = f"{MICROSERVICE_URL}/api/v1"

def generate_test_scenario():
    """Genera scenario di test ottimizzato per visualizzazione"""
    
    # Autoclavi di dimensioni ridotte per visualizzazione migliore
    autoclaves = [
        {
            "id": "AC-VIZ",
            "code": "AUTOCLAVE-VISUALIZZAZIONE",
            "width": 2000,    # 2m x 1.5m per visualizzazione
            "height": 1500,   
            "vacuum_lines": 4,
            "max_weight": 3000,
        }
    ]
    
    # ODL con dimensioni variabili ma visualizzabili
    odls = []
    for i in range(6):  # 6 ODL per test
        # Dimensioni graduate per test
        if i < 2:
            width, height = 800, 600    # Grandi
        elif i < 4:
            width, height = 600, 400    # Medi
        else:
            width, height = 400, 300    # Piccoli
        
        # Variabilità minima
        width += random.randint(-50, 50)
        height += random.randint(-25, 25)
        
        tools = [{
            "id": f"T{i+1}_1",
            "width": width,   
            "height": height, 
            "weight": (width * height * 5) / 1000000,
        }]
        
        odl = {
            "id": f"ODL-VIZ-{i+1:02d}",
            "odl_number": f"ODL-VIZ-{i+1:02d}",
            "part_number": f"PN-DEMO-{i+1:02d}",
            "curing_cycle": "CICLO_DEMO_180C",
            "vacuum_lines": 1,
            "tools": tools,
            "total_area": sum(t["width"] * t["height"] for t in tools) / 1000000,
            "priority": "NORMAL",
            "due_date": (datetime.now() + timedelta(days=7)).isoformat(),
        }
        
        odls.append(odl)
    
    return odls, autoclaves

def optimize_layout(odls, autoclaves):
    """Ottimizza layout tramite microservizio"""
    
    payload = {
        "odls": odls,
        "autoclaves": autoclaves, 
        "selected_cycles": ["CICLO_DEMO_180C"],
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
        print(f"❌ Errore connessione: {e}")
        return None

def draw_ascii_layout(batch, autoclave, scale=40):
    """
    Disegna layout in ASCII art
    scale: pixels per carattere (40mm per carattere)
    """
    
    # Dimensioni canvas in caratteri
    canvas_width = int(autoclave["width"] / scale) + 2
    canvas_height = int(autoclave["height"] / scale) + 2
    
    # Inizializza canvas
    canvas = [[' ' for _ in range(canvas_width)] for _ in range(canvas_height)]
    
    # Disegna bordi autoclave
    for x in range(canvas_width):
        canvas[0][x] = '═'
        canvas[canvas_height-1][x] = '═'
    
    for y in range(canvas_height):
        canvas[y][0] = '║'
        canvas[y][canvas_width-1] = '║'
    
    # Angoli
    canvas[0][0] = '╔'
    canvas[0][canvas_width-1] = '╗'
    canvas[canvas_height-1][0] = '╚'
    canvas[canvas_height-1][canvas_width-1] = '╝'
    
    # Disegna placements
    colors = ['1', '2', '3', '4', '5', '6', '7', '8', '9']
    
    for i, placement in enumerate(batch.get("placements", [])):
        color = colors[i % len(colors)]
        
        # Converte coordinate in posizioni canvas
        start_x = int(placement["x"] / scale) + 1
        start_y = int(placement["y"] / scale) + 1
        width = max(1, int(placement["width"] / scale))
        height = max(1, int(placement["height"] / scale))
        
        # Disegna rettangolo
        for y in range(start_y, min(start_y + height, canvas_height - 1)):
            for x in range(start_x, min(start_x + width, canvas_width - 1)):
                if y == start_y or y == start_y + height - 1:
                    canvas[y][x] = '─'
                elif x == start_x or x == start_x + width - 1:
                    canvas[y][x] = '│'
                else:
                    canvas[y][x] = color
        
        # Angoli del rettangolo
        if start_y < canvas_height - 1 and start_x < canvas_width - 1:
            canvas[start_y][start_x] = '┌'
        if start_y < canvas_height - 1 and start_x + width - 1 < canvas_width - 1:
            canvas[start_y][start_x + width - 1] = '┐'
        if start_y + height - 1 < canvas_height - 1 and start_x < canvas_width - 1:
            canvas[start_y + height - 1][start_x] = '└'
        if start_y + height - 1 < canvas_height - 1 and start_x + width - 1 < canvas_width - 1:
            canvas[start_y + height - 1][start_x + width - 1] = '┘'
    
    return canvas

def print_layout_info(result, odls, autoclaves):
    """Stampa informazioni del layout"""
    
    print(f"\n{'='*60}")
    print(f"🎯 VISUALIZZAZIONE LAYOUT OTTIMIZZATO")
    print(f"{'='*60}")
    
    if not result or "batches" not in result:
        print("❌ Nessun risultato di ottimizzazione disponibile")
        return
    
    batches = result["batches"]
    if not batches:
        print("❌ Nessun batch generato")
        return
    
    # Mostra statistiche generali
    print(f"\n📊 STATISTICHE GENERALI")
    print(f"   ODL totali: {len(odls)}")
    print(f"   ODL posizionati: {result.get('total_odls_placed', 0)}")
    print(f"   Batch creati: {len(batches)}")
    print(f"   Tasso successo: {result.get('success_rate', 0):.1%}")
    print(f"   Tempo ottimizzazione: {result.get('execution_time', 0):.2f}s")
    
    # Mostra ogni batch
    for i, batch in enumerate(batches):
        print(f"\n📦 BATCH {i+1}: {batch['batch_id'][:8]}...")
        
        autoclave = None
        for a in autoclaves:
            if a["id"] == batch["autoclave_id"]:
                autoclave = a
                break
        
        if not autoclave:
            print("   ❌ Autoclave non trovato")
            continue
        
        metrics = batch.get("metrics", {})
        efficiency = metrics.get("area_efficiency", 0) * 100
        
        print(f"   Autoclave: {autoclave['code']}")
        print(f"   Dimensioni: {autoclave['width']}mm x {autoclave['height']}mm")
        print(f"   Efficienza: {efficiency:.1f}%")
        print(f"   Tools posizionati: {len(batch.get('placements', []))}")
        
        # Disegna layout ASCII
        print(f"\n   LAYOUT AUTOCLAVE (scala 1:{40}mm per carattere):")
        
        canvas = draw_ascii_layout(batch, autoclave)
        
        for row in canvas:
            print("   " + "".join(row))
        
        # Legenda
        print(f"\n   LEGENDA:")
        print(f"   ╔═══╗ = Bordi autoclave")
        print(f"   ┌──┐  = Tools posizionati")
        print(f"   1,2,3 = Numeri identificativi tools")
        
        # Dettagli placements
        print(f"\n   DETTAGLI POSIZIONAMENTO:")
        
        for j, placement in enumerate(batch.get("placements", [])):
            odl_id = placement["odl_id"]
            tool_id = placement["tool_id"]
            x, y = placement["x"], placement["y"]
            w, h = placement["width"], placement["height"]
            rotated = placement.get("rotated", False)
            
            rotation_str = " (ruotato)" if rotated else ""
            
            print(f"   [{j+1}] {odl_id} → {tool_id}")
            print(f"       Pos: ({x:.0f}, {y:.0f})mm, Size: {w:.0f}x{h:.0f}mm{rotation_str}")

def main():
    """Main execution"""
    
    print("🔍 Generazione scenario di test...")
    
    # Verifica microservizio
    try:
        response = requests.get(f"{API_BASE}/health/", timeout=5)
        if response.status_code != 200:
            print("❌ Microservizio non disponibile")
            return
    except Exception as e:
        print(f"❌ Connessione fallita: {e}")
        return
    
    # Genera e ottimizza
    odls, autoclaves = generate_test_scenario()
    print(f"✅ Generati {len(odls)} ODL per visualizzazione")
    
    print("🚀 Ottimizzazione in corso...")
    result = optimize_layout(odls, autoclaves)
    
    if result:
        print_layout_info(result, odls, autoclaves)
    else:
        print("❌ Ottimizzazione fallita")

if __name__ == "__main__":
    main()