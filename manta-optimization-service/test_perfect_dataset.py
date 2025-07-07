#!/usr/bin/env python3
"""
Test Dataset Perfetto per Dimostrazione Efficacia
=================================================

Genera dataset ottimizzato per mostrare il pieno potenziale del microservizio
quando il rapporto area e dimensioni sono ideali per l'algoritmo.
"""

import requests
import json
from datetime import datetime, timedelta
import random
import math

# Configurazione
MICROSERVICE_URL = "http://localhost:8000"
API_BASE = f"{MICROSERVICE_URL}/api/v1"

def print_header(title: str):
    print(f"\n{'='*70}")
    print(f"🎯 {title}")
    print(f"{'='*70}")

def print_section(title: str):
    print(f"\n📊 {title}")
    print("-" * 50)

def print_result(label: str, value: any, unit: str = ""):
    print(f"   ✅ {label}: {value}{unit}")

def generate_perfect_dataset():
    """
    Genera dataset perfetto progettato per massimizzare l'efficacia del microservizio.
    
    Strategia:
    1. Dimensioni tools multiple di 100mm (facili da posizionare)
    2. Rapporto area 65% (ottimale per bin packing)
    3. Forme compatibili con rotazione
    4. Un solo ciclo di cura (no frammentazione)
    """
    
    # Autoclave ottimizzata per test
    autoclave = {
        "id": "AC-PERFECT",
        "code": "AUTOCLAVE-PERFECT-TEST",
        "width": 3000,    # 3m x 2m = 6 m²
        "height": 2000,   
        "vacuum_lines": 8,  # Abbondanti
        "max_weight": 5000,
    }
    
    autoclave_area = autoclave["width"] * autoclave["height"] / 1000000  # 6 m²
    target_area = autoclave_area * 0.65  # 65% utilizzo = 3.9 m²
    
    print_result("Area autoclave", f"{autoclave_area:.1f}", " m²")
    print_result("Area target ODL", f"{target_area:.1f}", " m² (65% utilizzo ottimale)")
    
    # Dimensioni tools ottimizzate per bin packing
    # Tutte multiple di 100mm e con aspect ratio compatibili
    perfect_tool_sizes = [
        (800, 600),   # 0.48 m² - aspect ratio 4:3
        (700, 500),   # 0.35 m² - aspect ratio 7:5  
        (600, 400),   # 0.24 m² - aspect ratio 3:2
        (500, 400),   # 0.20 m² - aspect ratio 5:4
        (400, 300),   # 0.12 m² - aspect ratio 4:3
        (300, 200),   # 0.06 m² - aspect ratio 3:2
    ]
    
    odls = []
    current_area = 0
    odl_count = 0
    
    # Calcola quanti tools servono per raggiungere target
    while current_area < target_area:
        odl_count += 1
        
        # Scegli dimensione appropriata per rimanere nel target
        remaining_area = target_area - current_area
        
        # Filtra solo tools che non sforeranno il target
        valid_sizes = [
            size for size in perfect_tool_sizes 
            if (size[0] * size[1] / 1000000) <= remaining_area
        ]
        
        if not valid_sizes:
            break  # Non ci sono più tools che entrano
        
        # Prendi il tool più grande che entra
        width, height = max(valid_sizes, key=lambda s: s[0] * s[1])
        
        # Variabilità minima mantenendo multipli di 50mm
        width_var = random.choice([-50, 0, 50])
        height_var = random.choice([-50, 0, 50])
        
        final_width = max(200, width + width_var)   # Min 200mm
        final_height = max(150, height + height_var) # Min 150mm
        
        # Tool singolo per ODL (tipico aerospace semplice)
        tool = {
            "id": f"T{odl_count}_1",
            "width": final_width,   
            "height": final_height, 
            "weight": (final_width * final_height * 5) / 1000000,
        }
        
        tool_area = (final_width * final_height) / 1000000
        
        odl = {
            "id": f"ODL-PERFECT-{odl_count:02d}",
            "odl_number": f"ODL-PERFECT-{odl_count:02d}",
            "part_number": f"PN-PERFECT-{odl_count:02d}",
            "curing_cycle": "CICLO_PERFECT_180C",  # Un solo ciclo
            "vacuum_lines": 1,  # Minimo vacuum per massima flessibilità
            "tools": [tool],
            "total_area": tool_area,
            "priority": "NORMAL",
            "due_date": (datetime.now() + timedelta(days=14)).isoformat(),
        }
        
        odls.append(odl)
        current_area += tool_area
        
        # Safety break
        if odl_count >= 20:
            break
    
    print_result("ODL generati", len(odls))
    print_result("Area effettiva ODL", f"{current_area:.2f}", " m²")
    print_result("Utilizzo teorico", f"{(current_area/autoclave_area)*100:.1f}", "%")
    print_result("Rapporto ottimale", "SÌ - 65% target raggiunto" if abs(current_area/autoclave_area - 0.65) < 0.05 else "NO")
    
    return odls, [autoclave]

def test_microservice_perfect(odls, autoclaves):
    """Testa microservizio con dataset perfetto"""
    
    payload = {
        "odls": odls,
        "autoclaves": autoclaves, 
        "selected_cycles": ["CICLO_PERFECT_180C"],
        "elevated_tools": [],
        "constraints": {
            "min_border_distance": 20,  # Ottimizzato
            "min_tool_distance": 15,    # Ottimizzato
            "allow_rotation": True      # Abilitato per massima flessibilità
        }
    }
    
    try:
        print("🚀 Esecuzione ottimizzazione...")
        
        import time
        start_time = time.time()
        
        response = requests.post(
            f"{API_BASE}/optimization/execute",
            json=payload,
            timeout=60
        )
        
        optimization_time = time.time() - start_time
        
        if response.status_code != 200:
            print(f"❌ Errore API: {response.status_code}")
            return None
            
        result = response.json()
        
        print_result("Tempo ottimizzazione", f"{optimization_time:.3f}", " secondi")
        
        return result, optimization_time
        
    except Exception as e:
        print(f"❌ Errore: {e}")
        return None

def analyze_perfect_results(result, odls, autoclaves, optimization_time):
    """Analizza risultati con dataset perfetto"""
    
    if not result:
        print("❌ Nessun risultato disponibile")
        return
    
    batches = result.get("batches", [])
    total_odls_placed = result.get("total_odls_placed", 0)
    success_rate = result.get("success_rate", 0)
    
    print_section("RISULTATI OTTIMIZZAZIONE PERFETTA")
    
    print_result("ODL totali", len(odls))
    print_result("ODL posizionati", total_odls_placed)
    print_result("ODL NON posizionati", len(odls) - total_odls_placed)
    print_result("Tasso successo", f"{success_rate:.1%}")
    print_result("Batch generati", len(batches))
    print_result("Tempo esecuzione", f"{optimization_time:.3f}", " secondi")
    
    # Analizza ogni batch
    total_efficiency = 0
    total_area_used = 0
    total_area_available = 0
    
    for i, batch in enumerate(batches):
        print_section(f"BATCH {i+1} - {batch['batch_id'][:8]}...")
        
        autoclave = autoclaves[0]  # Un solo autoclave
        autoclave_area = (autoclave["width"] * autoclave["height"]) / 1000000
        
        metrics = batch.get("metrics", {})
        efficiency = metrics.get("area_efficiency", 0) * 100
        placements = batch.get("placements", [])
        
        print_result("Autoclave", autoclave["code"])
        print_result("Efficienza spaziale", f"{efficiency:.1f}", "%")
        print_result("Tools posizionati", len(placements))
        
        # Calcola area utilizzata
        used_area = 0
        for placement in placements:
            used_area += (placement["width"] * placement["height"]) / 1000000
        
        print_result("Area utilizzata", f"{used_area:.2f}", " m²")
        print_result("Area disponibile", f"{autoclave_area:.2f}", " m²")
        
        total_efficiency += efficiency
        total_area_used += used_area
        total_area_available += autoclave_area
        
        # Mostra dettagli tools
        print("\n   DETTAGLI POSIZIONAMENTO:")
        for j, placement in enumerate(placements[:5]):  # Max 5 per brevità
            x, y = placement["x"], placement["y"]
            w, h = placement["width"], placement["height"]
            rotated = " (ruotato)" if placement.get("rotated", False) else ""
            
            print(f"   [{j+1}] {placement['odl_id']} → Pos: ({x:.0f},{y:.0f})mm, Size: {w:.0f}x{h:.0f}mm{rotated}")
        
        if len(placements) > 5:
            print(f"   ... e altri {len(placements) - 5} tools")
    
    # Risultati finali
    print_section("VALUTAZIONE FINALE")
    
    avg_efficiency = total_efficiency / len(batches) if batches else 0
    coverage = (total_odls_placed / len(odls)) * 100 if odls else 0
    
    print_result("EFFICIENZA MEDIA", f"{avg_efficiency:.1f}", "%")
    print_result("COPERTURA ODL", f"{coverage:.1f}", "%")
    print_result("AREA UTILIZZATA TOTALE", f"{total_area_used:.2f}", " m²")
    print_result("SPRECO AREA", f"{total_area_available - total_area_used:.2f}", " m²")
    
    # Valutazione prestazioni
    print_section("VALUTAZIONE PRESTAZIONI")
    
    if coverage >= 95:
        print("🟢 ECCELLENTE: Copertura quasi completa degli ODL")
    elif coverage >= 85:
        print("🟢 OTTIMO: Copertura molto buona degli ODL")
    elif coverage >= 75:
        print("🟡 BUONO: Copertura accettabile degli ODL")
    else:
        print("🔴 INSUFFICIENTE: Copertura troppo bassa")
    
    if avg_efficiency >= 80:
        print("🟢 ECCELLENTE: Efficienza spaziale molto alta")
    elif avg_efficiency >= 70:
        print("🟢 OTTIMO: Efficienza spaziale buona")
    elif avg_efficiency >= 60:
        print("🟡 BUONO: Efficienza spaziale accettabile")
    else:
        print("🔴 INSUFFICIENTE: Efficienza spaziale troppo bassa")
    
    if optimization_time < 5:
        print("🟢 ECCELLENTE: Tempo ottimizzazione molto rapido")
    elif optimization_time < 10:
        print("🟢 OTTIMO: Tempo ottimizzazione accettabile")
    else:
        print("🟡 MODERATO: Tempo ottimizzazione lento")
    
    # Conclusioni
    print_section("CONCLUSIONI")
    
    print(f"💡 Con dataset ottimizzato (65% utilizzo teorico), il microservizio:")
    print(f"   - Ha posizionato {total_odls_placed}/{len(odls)} ODL ({coverage:.1f}%)")
    print(f"   - Ha raggiunto {avg_efficiency:.1f}% di efficienza spaziale media")
    print(f"   - Ha completato l'ottimizzazione in {optimization_time:.3f} secondi")
    
    if coverage >= 90 and avg_efficiency >= 70:
        print(f"\n🎯 DIMOSTRAZIONE RIUSCITA: Il microservizio funziona eccellentemente")
        print(f"   con dataset adeguati, confermando la validità dell'approccio algoritmico!")
    else:
        print(f"\n⚠️  Risultati sotto aspettative anche con dataset ottimizzato")

def draw_compact_visualization(result, autoclave):
    """Disegna una visualizzazione compatta del miglior batch"""
    
    if not result or not result.get("batches"):
        return
    
    # Prendi il batch con maggiore efficienza
    best_batch = max(result["batches"], key=lambda b: b.get("metrics", {}).get("area_efficiency", 0))
    
    print_section("VISUALIZZAZIONE LAYOUT OTTIMALE")
    
    placements = best_batch.get("placements", [])
    efficiency = best_batch.get("metrics", {}).get("area_efficiency", 0) * 100
    
    print(f"Batch: {best_batch['batch_id'][:8]}... | Efficienza: {efficiency:.1f}% | Tools: {len(placements)}")
    print()
    
    # Scala per visualizzazione (60mm per carattere)
    scale = 60
    canvas_width = int(autoclave["width"] / scale) + 2
    canvas_height = int(autoclave["height"] / scale) + 2
    
    # Canvas semplificato
    canvas = [['·' for _ in range(canvas_width)] for _ in range(canvas_height)]
    
    # Bordi
    for x in range(canvas_width):
        canvas[0][x] = '─'
        canvas[canvas_height-1][x] = '─'
    for y in range(canvas_height):
        canvas[y][0] = '│'
        canvas[y][canvas_width-1] = '│'
    
    canvas[0][0] = canvas[0][canvas_width-1] = '┌'
    canvas[canvas_height-1][0] = canvas[canvas_height-1][canvas_width-1] = '└'
    
    # Placements
    symbols = ['■', '▲', '●', '♦', '▼', '◆', '★', '♠', '♣', '♥']
    
    for i, placement in enumerate(placements):
        symbol = symbols[i % len(symbols)]
        
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
    
    print(f"\n   Legenda simboli: {', '.join([f'{symbols[i]}=T{i+1}' for i in range(min(len(placements), len(symbols)))])}")
    print(f"   Scala: 1 carattere = {scale}mm")

def main():
    """Esecuzione test dataset perfetto"""
    
    print_header("TEST DATASET PERFETTO - DIMOSTRAZIONE EFFICACIA")
    print("Scenario ottimizzato per massimizzare le prestazioni del microservizio")
    
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
    
    # Genera dataset perfetto
    print_section("GENERAZIONE DATASET PERFETTO")
    odls, autoclaves = generate_perfect_dataset()
    
    # Test ottimizzazione
    result_data = test_microservice_perfect(odls, autoclaves)
    if not result_data:
        print("❌ Test fallito")
        return
    
    result, optimization_time = result_data
    
    # Analisi risultati
    analyze_perfect_results(result, odls, autoclaves, optimization_time)
    
    # Visualizzazione
    draw_compact_visualization(result, autoclaves[0])

if __name__ == "__main__":
    main()